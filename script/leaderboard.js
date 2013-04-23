(function(window, document, $, undefined) {

    $(document).ready(function() {

        var orgs = ['orgs/zynga', 'orgs/playscript', 'users/cocos2d'];
        var blacklist = ['gh-pages-template', 'jasy-compat'];

        function fetchRepos(orgs, callback, scope) {
            var deferredCalls = [];
            for (var i = 0, iLen = orgs.length; i < iLen; i++) {
                deferredCalls.push($.getJSON('https://api.github.com/' + orgs[i] + '/repos'));
            }

            var repos = [];
            $.when.apply($, deferredCalls).done(function() {
                for (var i = 0, iLen = arguments.length; i < iLen; i++) {
                    if (arguments[i][1] !== 'success') {
                        continue;
                    }
                    repos = repos.concat(arguments[i][0]);
                }
                callback.call(scope, repos);
            });
        }

        function renderLeaderboard(repos) {
            var container = $('#leaderboard');
            container.empty();

            for (var i = 0, iLen = repos.length; i < iLen; i++) {
                var repo = repos[i];
                var elem = $(
                    '<li class="' + (repo.language || '').toLowerCase() + '">' +
                    '<a href="' + repo.owner.html_url + '"><img class="owner-image" src="' + repo.owner.avatar_url + '" title="' + repo.owner.login + '" /></a>' +
                    '<a href="' + (repo.homepage ? repo.homepage : repo.html_url) + '">' + repo.name + '</a><br />' +
                    repo.description + '<br />' +
                    'Forks: ' + repo.forks + ', Watchers: ' + repo.watchers + ', Open Issues: ' + repo.open_issues + ', Last Updated: ' + $.timeago(repo.updated_at) +
                    '</li>');
                container.append(elem);
            }
        }

        fetchRepos(orgs, function(repos) {

            repos = repos.filter(function(element, index, array) {

                if (element.fork) {
                    return false;
                }

                if (element.name.indexOf('.github.com') > 0) {
                    return false;
                }

                if (element.name.indexOf('.github.io') > 0) {
                    return false;
                }

                if (blacklist.indexOf(element.name) >= 0) {
                    return false;
                }

                return true;
            });

            function getWeight(repo) {
                // forks * 3 + watchers - last update days * 5
                return (repo.forks * 3) + repo.watchers - (Math.floor((Date.now() - new Date(repo.updated_at).getTime()) / 86400000) * 5);
            }

            repos.sort(function(a, b) {
                return getWeight(b) - getWeight(a);
            });

            renderLeaderboard(repos);

        }, this);

    });

})(window, document, jQuery);
