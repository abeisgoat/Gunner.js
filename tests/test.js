i = 1;
(new Cannon("http://www.reddit.com/r/AbandonedPorn/.json")).projectile("data.children.*.data.url").reloader({after: "data.after"}).limit(2).fetcher(function (current, limit) {
    console.log('Fetching ' + current + ' of ' + limit);
}).rapidfire(function (projectile, cannon) {
    var pictures = document.getElementById("pictures");
    pictures.innerHTML += (i++);
    pictures.innerHTML += "<img src='" + projectile + "' width='400'/>"
});