'use strict';

var fs = require('fs');
var zlib = require('zlib');
var async = require('./async');
var cp = require('child_process');
var report = require('./report').report;
var tar = require('/opt/apps/machine/lamassu-machine/node_modules/tar');

var TIMEOUT = 10000;

var hardwareCode = process.argv[2] || 'N7G1';

function command(cmd, cb) {
  cp.exec(cmd, {timeout: TIMEOUT}, function(err) {
    cb(err);
  });
}

function remountRW(cb) {
  if (hardwareCode !== 'N7G1') return cb();
  command('/bin/mount -o remount,rw /', cb);
}

function untar(tarball, outPath, cb) {
  var fileIn = fs.createReadStream(tarball);
  fileIn.pipe(zlib.createGunzip()).pipe(tar.Extract(outPath))
  .on('error', cb)
  .on('end', cb);   // success
}

async.series([
  async.apply(remountRW),
  async.apply(command, 'mkdir -p /opt/apps/machine'),
  async.apply(untar, '/tmp/extract/package/subpackage.tgz', '/tmp/extract/package/'),
  async.apply(command, 'cp -a /tmp/extract/package/subpackage/lamassu-machine /opt/apps/machine'),
  async.apply(command, 'cp -a /tmp/extract/package/subpackage/hardware/' + hardwareCode + '/node_modules /opt/apps/machine/lamassu-machine'),
  async.apply(command, 'cp /tmp/extract/package/subpackage/hardware/' + hardwareCode + '/device_config.json /opt/apps/machine/lamassu-machine'),
  async.apply(command, 'cp /tmp/extract/package/subpackage/hardware/' + hardwareCode + '/lib/* /usr/local/lib'),
  async.apply(report, null, 'finished.')
], function(err) {
  if (err) throw err;
});
