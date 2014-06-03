Cannon
======

Tackle RESTful data and beat it into a useful format!

For example, load the first 2 pages of pictures on a subreddit:

    var Cannon = require('../src/Cannon')
    (new Cannon("http://www.reddit.com/r/AbandonedPorn/.json"))
        .projectile("data.children.*.data.url")
        .reloader({after: "data.after"})
        .limit(2)
        .fetcher(function (current, limit) {
            console.log('Fetching ' + current + ' of ' + limit);
        })
        .rapidfire(function (projectile, cannon) {
            console.log(projectile);
        });

For full docs and source-code annotation, see [the documented sources.](http://abeisgreat.github.io/Cannon.js/docs/Cannon.html).