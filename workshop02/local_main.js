const range = require('express-range')
const compression = require('compression')

const express = require('express')

const data = require('./zips')
const CitiesDB = require('./zipsdb')

//Load application keys
const db = CitiesDB(data);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Start of workshop

// Mandatory workshop
// TODO GET /api/states
app.get('/api/states',
	(req, resp) => { // Request handler
		const result = db.findAllStates();
		// status code
		resp.status(200)

		// set Content-Type
		resp.type('application/json')
		resp.set('X-generated-on', (new Date()).toDateString())
		resp.set('Access-Control-Allow-Origin', '*')
		resp.json(result)
	}
)

// TODO GET /api/state/:state
app.get('/api/state/:state',
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
		resp.json(result)
	}
)

// TODO DELETE /api/city/:name

// TODO GET /api/city/:cityId
app.get('/api/city/:cityId',
	(req, resp) => { // Request handler
		const cityId = req.params.cityId

		const result = db.findCityById(cityId)

		// status code
		resp.status(200)

		// set Content-Type
		resp.type('application/json')
		resp.json(result)
	}
)

// TODO POST /api/city
// Content-Type: application/x-www-form-urlencoded
app.post('/api/city',
	(req, resp) => {
		const body = req.body;
		console.info('body =', body);

		// Validate body.
		if (!db.validateForm(body)) {
			resp.status(400)
			resp.type('application/json')
			resp.json({'message': 'Incomplete form'})
			return
		}
		// Passed validation
		// Insert data into database.
		// TODO loc -> [123, 123]
		db.insertCity(body)

		resp.status(201)
		resp.type('application/json')
		resp.json({message: 'Created.'})
	}
)

// Optional workshop
// TODO HEAD /api/state/:state
// IMPORTANT: HEAD must be place before GET for the
// same resource. Otherwise the GET handler will be invoked


// TODO GET /state/:state/count
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


// End of workshop

const PORT = parseInt(process.argv[2] || process.env.APP_PORT) || 3000;
app.listen(PORT, () => {
	console.info(`Application started on port ${PORT} at ${new Date()}`);
});

