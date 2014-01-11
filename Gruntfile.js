module.exports = function (grunt) {
    grunt.initConfig({
        clean: {
            all: [
                'dist'
            ]
        },
        
        copy: {
            all: {
                files: [
                    {expand: true, cwd: 'src/', src: '**', dest: 'dist'},
                ]
            }
        },
                    
        jshint: {
            all: [
                'src/*.js'
            ]
        },     
            
        uglify: {
            "Cannon.min.js": {
                src: "dist/Cannon.js",
                dest: "dist/Cannon.min.js"
            }
        },
        
        watch: {
            scripts: {
                files: ['src/*.js'],
                tasks: ['jshint', 'copy', 'uglify', 'docco'],
            },
        },
        
        docco: {
            all: {
                src: ['src/*.js'],
                options: {
                    output: 'docs/'
                }
            }
        },
            
        notify_hooks: {
            options: {
              enabled: true,
              max_jshint_notifications: 5, // maximum number of notifications from jshint output
              title: "CannonJS" // defaults to the name in package.json, or will use project directory's name
            }
        }
    });
        
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-docco');
    grunt.loadNpmTasks('grunt-notify');
    
    grunt.registerTask('default', [
    'jshint:all',
    'clean:all',
    'copy:all',
    'uglify:Cannon.min.js',
    'docco:all'
    ]);   
};