const url = require('url')
const http = require('http')

class App {
    constructor() {
        this.routes = {}
        this.globalHandleStack = []
        this.handle = this.handle.bind(this)
    }

    use(path, ...middlewares) {
        if (typeof path === 'string') {
            if (this.routes[path]) {
                this.routes[path].push(...middlewares)
            } else {
                this.routes[path] = middlewares
            }
        } else if (typeof path === 'function') {
            this.globalHandleStack.push(path)
            this.globalHandleStack.push(...middlewares)
        } else {
            console.log('use error!')
        }
    }

    // 匹配路径，应用中间件
    handle(req, res) {
        let pathname = url.parse(req.url).pathname

        let stack = this.globalHandleStack.slice()
        if (this.routes[pathname]) {
            stack.push(...(this.routes[pathname]))
        } else {
            this.handle404(req, res)
            return
        }
        this.work(req, res, stack)
    }

    handle404(req, res) {
        res.writeHead(404, 'Bad Request')
        res.end('Bad Request')
    }

    // 将匹配的中间件执行完
    work(req, res, stack) {
        let next = function() {
            let middleware = stack.shift()
            if (middleware) {
                middleware(req, res, next)
            }
        }
        next()
    }

    run(host = 'localhost', port = 5000) {
        http.createServer(this.handle).listen(port, host)
        console.log(`Server runing at http://${host}:${port}`)
    }
}


/*
 * 解析请求，将解析结果绑定到`req.query`
 */
const parseQuery = function(req, res, next) {
    req.query = url.parse(req.url, true).query
    next()
}

/*
 * 解析cookie，将解析结果绑定到`req.cookies`
 */
const parseCookie = function(req, res, next) {
    req.cookies = {}
    let cookies = req.headers.cookie
    if (cookies) {
        let list = cookies.split(';')
        for (let pair of list) {
            let [key, value] = pair.split('=')
            req.cookies[key.trim()] = value
        }
    }
    next()
}

if (require.main == module) {
    let app = new App()

    let index = (req, res, next) => {
        res.writeHead(200, {'Content-Type': 'text/plain'})
        res.end('index page')
        next()
    }

    let hello = (req, res, next) => {
        res.writeHead(200, {'Content-Type': 'text/plain'})
        res.end('Hello, 世界!')
        next()
    }

    let query = (req, res, next) => {
        res.writeHead(200, {'Content-Type': 'text/plain'})
        res.end(`query: ${JSON.stringify(req.query)}`)
        next()
    }

    let cookie = (req, res, next) => {
        res.writeHead(200, {'Content-Type': 'text/plain'})
        res.end(`cookies: ${JSON.stringify(req.cookies)}`)
        next()
    }

    app.use(parseQuery)
    app.use(parseCookie)
    app.use('/', index)
    app.use('/hello', hello)
    app.use('/query', query)
    app.use('/cookie', cookie)

    app.run()
}

module.exports = App
