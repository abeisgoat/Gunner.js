var Cannon = require('../src/Cannon');
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