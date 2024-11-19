import gulp from 'gulp';
import { exec } from 'child_process';

let extensionProcess = null;
let portalProcess = null;

function build(cb) {
  exec('turbo --filter ueberdosis_text-editor build', (err, stdout, stderr) => {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}

function startServer(command, processRef, cb) {
  if (processRef) {
    processRef.kill('SIGTERM');
  }

  processRef = exec(command);

  processRef.stdout.on('data', data => {
    console.log(data);
  });

  processRef.stderr.on('data', data => {
    console.error(data);
  });

  processRef.on('close', code => {
    console.log(`Server exited with code ${code}`);
    cb();
  });

  cb();
}

function startPortal(cb) {
  startServer('turbo --filter returfs_portal dev', portalProcess, cb);
}

function startExtension(cb) {
  startServer(
    'turbo --filter ueberdosis_text-editor dev',
    extensionProcess,
    cb,
  );
}

function watchFiles() {
  gulp.watch(
    ['resources/**/*', '../../shared/shared-external-react/dist/**/*'],
    gulp.series(build),
  );
}

export default gulp.series(
  build,
  gulp.parallel(startPortal, startExtension, watchFiles),
);
