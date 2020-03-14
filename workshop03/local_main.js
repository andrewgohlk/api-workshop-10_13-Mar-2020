const { join } = require('path');
const fs = require('fs');

// Load the library
const preconditions = require('express-preconditions');

const cors = require('cors');
const range = require('express-range')
const compression = require('compression')

const { Validator, ValidationError } = require('express-json-validator-middleware')
const  OpenAPIValidator  = require('express-openapi-validator').OpenApiValidator;

const schemaValidator = new Validator({ allErrors: true, verbose: true });

const express = require('express')

const data = require('./zips')
const CitiesDB = require('./zipsdb')

//Load application keys
const db = CitiesDB(data);

const app = express();
// Disable express etag.
app.set('etag', false)

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Start of workshop
var count=0

// TODO 1/2 Load schemas
new OpenAPIValidator({
    apiSpec: join(__dirname, 'schema', 'zips.yaml')
}).install(app)
.then(() => {
    // OK we can proceed with the rest of our app.
    // TODO 2/2 Copy your routes from workshop02 here

    // ===vvv=== Start of workshop02 ===vvv===

    // Mandatory workshop
    // TODO GET /api/states
    // Added by Andrew Goh, 2020-03-11.
    app.get('/api/states',
        (req, resp) => { // Request handler
            count++
            console.info('In GET /api/states: ', count)

            const result = db.findAllStates();
            // status code
            resp.status(200)

            // Use Cache-Control in headers for Time Based Caching.
            // Set header, public, age = 5 min
            resp.set('Cache-Control', 'public, maxAge=300')

            // set Content-Type
            resp.type('application/json')
            resp.set('X-generated-on', (new Date()).toDateString())
            resp.set('Access-Control-Allow-Origin', '*')
            resp.json(result)
        }
    )

    // Use Etag for Content Based Caching.
    const options = {
        stateAsync: (req) => {
            const state = req.params.state;
            const offset = parseInt(req.query.offset) || 0;
            const limit = parseInt(req.query.limit) || 10;
            return Promise.resolve({
                // state_offset_limit
                // E.g. CA_0_10
                etag: `"${state}_${offset}_${limit}"`
            })
        }
    }

    // TODO GET /api/state/:state
    // Added by Andrew Goh, 2020-03-11.
    app.get('/api/state/:state',
        // Use the Etag here before the Request handler.
        preconditions(options),
        (req, resp) => { // Request handler
            // Read the value from the route :state
            const state = req.params.state

            // Read the query string
            const offset = parseInt(req.query.offset) || 0;	// If parseInt returns False, default to 0.
            const limit = parseInt(req.query.limit) || 10;	// If parseInt returns False, default to 10.

            // Default 10 records
            const result = db.findCitiesByState(state,
                {offset, limit}		// Shortform if key = value variable.
                // {offset: offset, limit: limit}
            );
            // status code
            resp.status(200)

            // set Content-Type
            resp.type('application/json')

            // Set E-tag
            resp.set("ETag", `"${state}_${offset}_${limit}"`)

            resp.json(result)
        }
    )

    // TODO DELETE /api/city/:name
    // Added by Andrew Goh, 2020-03-12.
    app.delete('/api/city/:name',
        (req, resp) => { // Request handler
            const name = req.params.name

            // No DB service for delete.
            //const result = db.deleteByName(name)	
            //console.info(result)

            // Nevertheless, fake the response to browser.
            // status code
            resp.status(200)

            // set Content-Type
            resp.type('application/json')
            resp.json({message: "Deleted: city = '"+name+"'"})
        }
    )

    // TODO GET /api/city/:cityId
    // Added by Andrew Goh, 2020-03-11.
    app.get('/api/city/:cityId',
        (req, resp) => { // Request handler
            const cityId = req.params.cityId

            const result = db.findCityById(cityId)
            //console.info(result)

            // status code
            resp.status(200)

            // set Content-Type
            resp.type('application/json')
            resp.json(result)
        }
    )

    // TODO POST /api/city
    // Added by Andrew Goh, 2020-03-11.
    // Content-Type: application/x-www-form-urlencoded
    app.post('/api/city',
        (req, resp) => {
            const body = req.body;
            console.info('body =', body);

            // Validate body.
            // if (!db.validateForm(body)) {
            //     resp.status(400)
            //     resp.type('application/json')
            //     resp.json({'message': 'Incomplete form'})
            //     return
            // }

            // Passed validation
            // Insert data into database.
            // TODO loc = "number, number" => [ number, number ]

            // Convert loc 'number,number' => [ number, number ]
            // const loc = body['loc'].split(',');
            // var loc_new = new Array;
            // loc_new[0] = parseInt(loc[0]);
            // loc_new[1] = parseInt(loc[1]);
            // body['loc'] = loc_new;
            
            // // Convert 'pop' to integer values.
            // body['pop'] = parseInt(body['pop']);
            // console.info('loc_new =', loc_new);
            // console.info('body (new) =', body);

            db.insertCity(body);

            resp.status(201)
            resp.type('application/json')
            resp.json({message: 'Created.', body})
        }
    )

    // Optional workshop
    // TODO HEAD /api/state/:state
    // IMPORTANT: HEAD must be place before GET for the
    // same resource. Otherwise the GET handler will be invoked


    // TODO GET /state/:state/count
    // Added by Andrew Goh, 2020-03-11.
    app.get('/api/state/:state/count',
        (req, resp) => { // Request handler
            const state = req.params.state
            const count = db.countCitiesInState(state)

            const result = {	// Create JSON object
                state: state,
                numOfCities: count,
                timestamp: (new Date()).toDateString()
            } 

            // status code
            resp.status(200)

            // set Content-Type
            resp.type('application/json')
            resp.json(result)
        }
    )

    // TODO GET /api/city/:name
    // Added by Andrew Goh, 2020-03-11.
    // Can't work, always return null; because conflict with resource '/api/city/:cityId'
    // Changed resource to '/api/city/name/:name'.
    app.get('/api/city/name/:name',
        (req, resp) => { // Request handler
            const name = req.params.name

            const result = db.findCitiesByName(name)
            // status code
            resp.status(200)

            // set Content-Type
            resp.type('application/json')
            resp.json(result)
        }
    )
    
    // ===^^^=== End of workshop02 ===^^^===

    // workshop02 above ^^^
    app.use('/schema', express.static(join(__dirname, 'schema')));

    app.use((error, req, resp, next) => {
    
        if (error instanceof ValidationError) {
            console.error('Schema validation error: ', error)
            return resp.status(400).type('application/json').json({ error: error });
        }
    
        else if (error.status) {
            console.error('OpenAPI specification error: ', error)
            return resp.status(400).type('application/json').json({ error: error });
        }
    
        console.error('Error: ', error);
        resp.status(400).type('application/json').json({ error: error });
    
    });
    
    const PORT = parseInt(process.argv[2] || process.env.APP_PORT) || 3000;
    app.listen(PORT, () => {
        console.info(`Application started on port ${PORT} at ${new Date()}`);
    });
})
.catch(error => {
    // There is an error with our yaml file.
    console.error('Error: ', error);
})

// End of workshop