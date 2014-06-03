Cannon.js
======

Tackle RESTful data and beat it into a useful format!

For example, load the first 2 pages of pictures on a subreddit:

    var Cannon = require('cannon');
    (new Cannon("http://www.reddit.com/r/Pics/.json"))
        .projectile("data.children.*.data.url")
        .reloader({after: "data.after"})
        .limit(2)
        .fetcher(function (current, limit) {
            // Called on each HTTP load
            console.log('Fetching ' + current + ' of ' + limit);
        })
        .rapidfire(function (projectile, cannon) {
            // Called once for each link in the subreddit
            console.log(projectile);
        });

For full docs and source-code annotation, see [the documented sources.](http://abeisgreat.github.io/Cannon.js/docs/Cannon.html).