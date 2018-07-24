const url = require('url')
const http = require('http')


class App {
    constructor() {
        this.routes = {}
        this.handle = this.handle.bind(this)
    }

    use(path, action) {
        this.routes[path] = action
    }

    handle(req, res) {
        let pathname = url.parse(req.url).pathname
        let action = this.routes[pathname]
        if (action) {
            action(req, res)
        } else {
            this.handle404(req, res)
        }
    }

    handle404(req, res) {
        res.writeHead(404, 'Bad Request')
        res.end('Bad Request')
    }

    run(host = 'localhost', port = 5000) {
        http.createServer(this.handle).listen(port, host)
        console.log(`Server runing at http://${host}:${port}`)
    }
}

if (require.main == module) {
    let app = new App()

    let index = (req, res) => {
        res.writeHead(200, 'OK')
        res.end('Index')
    }

    let hello = (req, res) => {
        res.writeHead(200, 'OK')
        res.end('Hello, World!')
    }

    app.use('/', index)
    app.use('/hello', hello)

    app.run()
}

module.exports = App
