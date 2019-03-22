module.exports = {
    production: {
        port: process.env.PORT || 3000,
        db: {
            name: 'main',
            host: 'ds011442.mlab.com',
            port: 11442,
            user: 'OjyyRJZk',
            password: '2D86VZgQ',
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
    },
    test: {
        port: 3000,
        db: {
            name: 'kaakuna_test',
            host: 'ds011442.mlab.com',
            port: 11442,
            user: 'OjyyRJZk',
            password: '2D86VZgQ',
            url() {
                return `mongodb://${this.user}:${this.password}@${this.host}:${this.port}/${this.name}`;
            }
        }
    }
};