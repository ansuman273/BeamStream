var should = require('should');
var supertest = require('supertest');

var server = supertest.agent('http://localhost:9000');

describe('File upload test cases',function(){
	it('should upload file',function(done){
		server
		.post('/api/video')
		.field('filename', 'test')
		.attach('file', 'test/test.mp4')
		.expect(200)
		.end(function(err,res){
			res.status.should.equal(200)
			done();
		});
	});
});
