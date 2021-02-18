const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const router = express.Router()


const https = require('https')
const url = require('url')
const bodyParser = require('body-parser')

express()
	.use(express.static(path.join(__dirname, 'public')))
	.use(
		bodyParser.urlencoded({
			extended: true,
		})
	)
	.use(bodyParser.json())
	.set('views', path.join(__dirname, 'views'))
	.set('view engine', 'ejs')
	.get('/', (req, res) => res.render('pages/index'))
	.get('/create_upload_task', function (req, res) {
		const create_upload_options = {
			hostname: 'api.cloudconvert.com',
			port: 443,
			path: '/v2/import/upload',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + process.env.CLOUDCONVERT_PERSONAL_ACCESS_TOKEN,
			}
		}

		let cloudconvert_data = '';
		const cloudconvert_req = https.request(create_upload_options, res2 => {
			res2.on('data', d => {
				cloudconvert_data += d
			})
			res2.on('end', () => {
				res.send(JSON.parse(cloudconvert_data))
			})
		})

		cloudconvert_req.on('error', error => {
			console.error(error)
		})

		cloudconvert_req.end()
	})
	.post('/create_convert_and_export_job', function (req, res) {
		const job_data = JSON.stringify({
			tasks: {
				convert_the_file: {
					operation: 'convert',
					input: req.body.upload_task_id,
					input_format: req.body.input_format,
					output_format: req.body.output_format,
					filename: 'rundrawer.mp4'
				},
				export_the_file: {
					operation: 'export/url',
					input: 'convert_the_file'
				}
			}
		})
		console.log(job_data)

		const create_convert_options = {
			hostname: 'api.cloudconvert.com',
			port: 443,
			path: '/v2/jobs',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + process.env.CLOUDCONVERT_PERSONAL_ACCESS_TOKEN,
			}
		}

		let cloudconvert_data = '';
		const cloudconvert_req = https.request(create_convert_options, res2 => {
			res2.on('data', d => {
				cloudconvert_data += d
			})
			res2.on('end', () => {
				res.send(JSON.parse(cloudconvert_data))
			})
		})

		cloudconvert_req.on('error', error => {
			console.error(error)
		})

		cloudconvert_req.write(job_data)
		cloudconvert_req.end()
	})
	.post('/create_convert_task', function (req, res) {
		console.log(req.body)
		const data = JSON.stringify({
			input: req.body.input,
			input_format: req.body.input_format,
			output_format: req.body.output_format
		})
		console.log(data)

		const create_convert_options = {
			hostname: 'api.cloudconvert.com',
			port: 443,
			path: '/v2/convert',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + process.env.CLOUDCONVERT_PERSONAL_ACCESS_TOKEN,
			}
		}

		let cloudconvert_data = '';
		const cloudconvert_req = https.request(create_convert_options, res2 => {
			res2.on('data', d => {
				cloudconvert_data += d
			})
			res2.on('end', () => {
				res.send(JSON.parse(cloudconvert_data))
			})
		})

		cloudconvert_req.on('error', error => {
			console.error(error)
		})

		cloudconvert_req.write(data)
		cloudconvert_req.end()
	})
	.get('/check_job_status', function (req, res) {
		const check_job_options = {
			hostname: 'api.cloudconvert.com',
			port: 443,
			path: '/v2/jobs/' + req.query.job_id,
			method: 'GET',
			headers: {
				'Authorization': 'Bearer ' + process.env.CLOUDCONVERT_PERSONAL_ACCESS_TOKEN
			}
		}

		let cloudconvert_data = '';
		const cloudconvert_req = https.request(check_job_options, res2 => {
			res2.on('data', d => {
				cloudconvert_data += d
			})
			res2.on('end', () => {
				res.send(JSON.parse(cloudconvert_data))
			})
		})

		cloudconvert_req.on('error', error => {
			console.error(error)
		})

		cloudconvert_req.end()
	})
	.listen(PORT, () => console.log(`Listening on ${ PORT }`))