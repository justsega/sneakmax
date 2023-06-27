import _ from 'lodash';
import HttpErrors from 'http-errors';

const { Unauthorized, Conflict } = HttpErrors;

const genId = (arr) => {
    if (arr.length === 0) return 1;
    const ids = arr.map((elem) => elem.id)
    const max = Math.max(...ids);
    return max + 1;
};

const buildState = (defaultState) => {
    
    const state = {
        catalogs: [
            { id: 1, brand: 'Adidas', products: [1, 2] },
            { id: 2, brand: 'Nike', products: [] },
            { id: 3, brand: 'Puma', products: [] },
            { id: 4, brand: 'Reebok', products: [] },
            { id: 5, brand: 'Converse', products: [] },
        ],
        products: [
            {
                id: 1,
                model: 'Some model name',
                descr: "The best sneakers",
                price: 15000,
                pictures: ['path to pics'],
                brand_id: 1
            },
            {
                id: 2,
                model: 'Some model name 2',
                descr: "The best sneakers as always",
                price: 12000,
                pictures: ['path to pics2'],
                brand_id: 1
            },
        ],
        users: [
            { id: 1, username: 'user', password: 'user', role: 'user', cart: [] },
            { id: 2, username: 'manager', password: 'manager', role: 'manager' },
        ],
    }
  
    if (defaultState.calatogs) {
      state.calatogs.push(...defaultState.calatogs);
    }
    if (defaultState.products) {
      state.products.push(...defaultState.products);
    }
    if (defaultState.users) {
      state.users.push(...defaultState.users);
    }
    return state;
  };

export default async (fastify, defaultState = {}) => {
    
    const state = buildState(defaultState);
    // Test service
    fastify.get('/api/v1/test', async () => {
        return { database: state };
    })
    // ------------

    // Users
    fastify.post('/api/v1/signup', async (req, res) => {
        const username = _.get(req, 'body.username');
        const password = _.get(req, 'body.password');
        const user = state.users.find((user) => user.username === username);
    
        if (user) {
          res.send(new Conflict());
          return;
        }
        const role = 'user';
        const newUser = { id: genId(state.users), username, password, role, cart: [] };
        const token = fastify.jwt.sign({ userId: newUser.id });
        state.users.push(newUser);
        res
          .code(201)
          .header('Content-Type', 'application/json; charset=utf-8')
          .send({ token, username, role });
      });

    fastify.post('/api/v1/login', async (req, res) => {
        const username = _.get(req, 'body.username');
        const password = _.get(req, 'body.password');
        const user = state.users.find((user) => user.username === username);
    
        if (!user || user.password !== password) {
          res.send(new Unauthorized());
          return;
        }
    
        const token = fastify.jwt.sign({ userId: user.id });
        res.send({ token, username, role: user.role });
      });

    //Catalogs
    fastify.get('/api/v1/catalogs', async () => {
        if (!state.catalogs) {
            throw new Error('Catalog is empty');
        }
        return { calatog: state.catalogs };
    });

    fastify.get('/api/v1/catalogs/:id', async (req) => {
        const { id } = req.params;
        const { catalogs } = state;
        const result = catalogs.find((catalog) => catalog.id === Number(id));
        return result;
    });

    fastify.post('/api/v1/catalogs', async (req) => {
        const { body } = req;
        const newCatalog = {id: genId(state.catalogs), ...body }
        state.catalogs.push(newCatalog);
        return 'Catalog was added';
    })

    fastify.put('/api/v1/catalogs/:id', async (req) => {
        const { id } = req.params;
        const { body } = req;
        const { catalogs } = state;
        const index = _.findIndex(catalogs, { id: Number(id) });
        state.catalogs[index] = body;
        return 'Catalog was changed';
    })

    fastify.delete('/api/v1/catalogs/:id', async (req) => {
        const { id } = req.params;
        const { catalogs } = state;
        const deleted = catalogs.filter((catalog) => catalog.id !== Number(id));
        state.catalogs = deleted;
        return 'Catalog was deleted';
    })
    // ------------

    // Products
    fastify.get('/api/v1/pic/:pic', async (req, res) => {
        const { pic } = req.params;
        return res.sendFile(`${pic}`);
    })


    fastify.get('/api/v1/products', async () => {
        const { products } = state;
        return { products };
    })

    fastify.get('/api/v1/products/:id', async (req, res) => {
        const { id } = req.params;
        const { products } = state;
        const result = products.find((product) => product.id === Number(id));
        return result;
    });

    fastify.post('/api/v1/products', async (req, res) => {
        const { body } = req;
        const newProducts = { id: genId(state.products), ...body }
        state.products.push(newProducts);
        return 'Product was added';
    })

    fastify.put('/api/v1/products/:id', async (req) => {
        const { id } = req.params;
        const { body } = req;
        const { products } = state;
        const index = _.findIndex(products, { id: Number(id) })
        state.products[index] = body;
        return 'Product was changed';

    })

    fastify.delete('/api/v1/products/:id', async (req) => {
        const { id } = req.params;
        const { products } = state;
        const deleted = products.filter((product) => product.id !== Number(id))
        state.products = deleted;
        return 'Product was deleted';
    })
    // ------------
}