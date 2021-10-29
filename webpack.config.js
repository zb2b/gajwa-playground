module.exports = {
    entry:{
        index : "./public/project.js"
    },
    output: {
        filename: 'app.js',
        path: __dirname + '/public/webpack'
    },
    resolve: {
        fallback: { "crypto": false }
    },
    devtool: 'source-map',
    //mode: "production",
    mode: "development",
    watch: true,
    optimization: {
        providedExports: true
    }
};