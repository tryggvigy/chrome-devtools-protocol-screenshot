#!/usr/bin/env node

const CDP = require('chrome-remote-interface')
const fs = require('fs')
const path = require('path')
const program = require('commander')

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const intList = val => val.split(',').map(n => parseInt(n))

program
.version('0.1.0')
.description(`Reads instructions from stdin or args and captures screenshots
  using the chrome devtools protocol from a running blink-based
  browser instance at various given breakpoints.`)
.usage('--breakPoints 1200,800,400 -p 9222')
.option('-o, --outputDir <path>', 'set output directory')
.option(
  '-p, --remoteDebuggingPort <port>',
  'set remote debugging port',
  parseInt
)
.option(
  '-b, --breakPoints <b1,b2,b3>',
  'breakPoints to take a screenshot at. Only usable with no stdin pipe.',
  intList
)
.parse(process.argv);

const dir = path.resolve(program.outputDir || './screenshot_captures');

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

if (process.stdin.isTTY) {
  singlePage();
} else {
  // data was piped
  var stdin = process.openStdin()
  var data = ""
  stdin.on('data', chunk => { data += chunk })
  stdin.on('end', () => { withStdIn(JSON.parse(data)) })
}

function withStdIn(data) {
  CDP({port: program.remoteDebuggingPort}, async (client) => {
    const {Page, Emulation, Runtime} = client;

    const originalDimentions = await Page
      .getLayoutMetrics()
      .then(r => r.layoutViewport)

    for ([uri, opt] of Object.entries(data.uris)) {

      await Runtime.evaluate({
        expression: `window.location="${uri}"`,
        returnByValue: true
      })
      
      // Give the page time to render before taking a screenshot
      await sleep(program.navigationSleep || 0)

      for (b of opt.breakPoints) {
        await Emulation.setVisibleSize({
          width: b,
          height: originalDimentions.clientHeight,
        });

        const b64Img = await Page.captureScreenshot();
        const buffer = new Buffer(b64Img.data, 'base64');

        fs.writeFileSync(`${dir}/${uri}_${b}.png`, buffer);
        console.log(`wrote: ${dir}/${uri}_${b}.png`);
      }
    }

    // Reset the client size.
    await Emulation.setVisibleSize({
      width: originalDimentions.clientWidth,
      height: originalDimentions.clientHeight,
    });

    client.close();
  });
}

function singlePage(data) {
  CDP({port: program.remoteDebuggingPort}, async (client) => {
    const {Page, Emulation, Runtime} = client;

    const originalDimentions = await Page
      .getLayoutMetrics()
      .then(r => r.layoutViewport)

    for(b of program.breakPoints) {
      await Emulation.setVisibleSize({
        width: b,
        height: originalDimentions.clientHeight,
      });

      const b64Img = await Page.captureScreenshot();
      const buffer = new Buffer(b64Img.data, 'base64');

      fs.writeFileSync(`${dir}/${b}.png`, buffer);
      console.log(`wrote: ${dir}/${b}.png`);
    }

    // Reset the client size.
    await Emulation.setVisibleSize({
      width: originalDimentions.clientWidth,
      height: originalDimentions.clientHeight,
    });

    client.close();
  });
}
