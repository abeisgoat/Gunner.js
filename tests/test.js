(new Cannon("http://api.reddit.com/user/abeisgreat/comments.json")).projectile("data.children.*.data.subreddit").delay(100).fire(function (projectile, cannon) {
    console.log("Caught projectile");
    
    console.log(projectile);
    
    var posts = cannon.recoil("PixelArt");
    for (var postIndex in posts) {
        var post = posts[postIndex];
        console.log(post.body);
    }
});