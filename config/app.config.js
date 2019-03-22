module.exports = {
    production: {
        port: process.env.PORT || 3000,
        db: {
            name: 'kaakuna',
            host: 'ds121406.mlab.com',
            port: 21406,
            user: 'kaakuna',
            password: '525System',
            url() {
                return `mongodb://${this.user}:${this.password}@${this.host}:${this.port}/${this.name}`;
            }
        }
    },
    development: {
        port: 3000,
        db: {
            name: 'kaakuna_dev',
            host: '127.0.0.1',
            port: 27017,
            url() {
                return `mongodb://${this.host}:${this.port}/${this.name}`;
            }
        }
    }
};
