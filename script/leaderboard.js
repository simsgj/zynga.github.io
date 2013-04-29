(function(window, document, $, undefined) {

    // TODO: Repos should be cached

    $(document).ready(function() {

        var orgs = ['orgs/zynga', 'orgs/playscript', 'users/cocos2d'];
        var blacklist = ['gh-pages-template', 'jasy-compat'];
        var weightFunction = 'forks';

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

            for (var i = 0, iLen = (repos.length > 10 ? 10 : repos.length); i < iLen; i++) {
                var repo = repos[i];
                var elem = $(
                    '<li class="' + (repo.language || '').toLowerCase() + ' place' + (i + 1) + '">' +
                    '<a href="' + (repo.homepage ? repo.homepage : repo.html_url) + '">' +
                    '<span class="place place' + (i + 1) + '">' + (i + 1) + '</span>' +
                    '<span class="name">' + repo.full_name + '</span><br />' +
                    repo.description + '<br />' +
                    'Forks: ' + repo.forks + ', Watchers: ' + repo.watchers + ', Open Issues: ' + repo.open_issues + ', Last Updated: ' + $.timeago(repo.updated_at) +
                    '<span class="score">' + repo.leaderboardScore + '</span>' +
                    '</a>' +
                    '</li>');
                container.append(elem);
            }
        }

        var updateLeaderboard = window.updateLeaderboard = function(weight) {
            weightFunction = weight || weightFunction;

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
                    switch (weightFunction) {
                        case 'forks':
                            repo.leaderboardScore = repo.forks;
                            break;

                        case 'watchers':
                            repo.leaderboardScore = repo.watchers;
                            break;

                        case 'watchfork':
                            repo.leaderboardScore = repo.forks + repo.watchers;
                            break;

                        case 'recent':
                            repo.leaderboardScore = '';
                            return (new Date(repo.updated_at).getTime());
                            break;
                        case 'weighted':
                        default:
                            // forks * 3 + watchers - last update days * 5
                            repo.leaderboardScore = (repo.forks * 3) + repo.watchers - (Math.floor((Date.now() - new Date(repo.updated_at).getTime()) / 86400000) * 5);
                            break;
                    }

                    return repo.leaderboardScore;
                }

                repos.sort(function(a, b) {
                    return getWeight(b) - getWeight(a);
                });

                renderLeaderboard(repos);

            }, this);
        }

        updateLeaderboard();

        $('#leaderboardNav li').click(function() {
            updateLeaderboard(this.getAttribute('data-filter'));
            $('#leaderboardNav li').removeClass('active');
            $(this).addClass('active');
            document.selection.empty();
        });

    });

})(window, document, jQuery);
