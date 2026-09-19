module.exports = {
  apps: [{
    name: 'ecofone-pos',
    cwd: __dirname,
    script: 'npm',
    args: 'start',
    exec_mode: 'fork',
    instances: 1,
    env: {
      NODE_ENV: 'production'
    }
  }]
};