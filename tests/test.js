(new Cannon("http://www.reddit.com/r/AbandonedPorn/.json")).projectile("data.children.*.data.url").reloader({after: "data.after"}).limit(3).rapidfire(function (projectile, cannon) {
    var pictures = document.getElementById("pictures");
    pictures.innerHTML += "<img src='" + projectile + "' width='400'/>"
});