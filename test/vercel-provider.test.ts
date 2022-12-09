/* Copyright © 2022 Seneca Project Contributors, MIT License. */

import * as Fs from 'fs'

const Seneca = require('seneca')
const SenecaMsgTest = require('seneca-msg-test')

import VercelProvider from '../src/vercel-provider'
import VercelProviderDoc from '../src/VercelProvider-doc'

const BasicMessages = require('./basic.messages.js')

// Only run some tests locally (not on Github Actions).
const ENV: any = {}
const CONFIG: any = {
  VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID,
  VERCEL_PROJECT_NAME: process.env.VERCEL_PROJECT_NAME,
}

// Get env vars from local-env.js.
if (Fs.existsSync(__dirname + '/local-env.js')) {
  Object.assign(ENV, require(__dirname + '/local-env.js'))
}
// Get CONFIGS from local-config.js.
if (Fs.existsSync(__dirname + '/local-config.js')) {
  Object.assign(CONFIG, require(__dirname + '/local-config.js'))
}


describe('vercel-provider', () => {

  test('happy', async () => {
    expect(VercelProvider).toBeDefined()
    expect(VercelProviderDoc).toBeDefined()

    const seneca = await makeSeneca()

    expect(await seneca.post('sys:provider,provider:vercel,get:info'))
      .toMatchObject({
        ok: true,
        name: 'vercel',
      })

  })


  test('messages', async () => {
    const seneca = await makeSeneca()
    await (SenecaMsgTest(seneca, BasicMessages)())
  })


  test('projects-basic-list', async () => {
    if (!ENV) return;

    const seneca = await makeSeneca()

    const list = await seneca.entity("provider/vercel/projects").list$()
    expect(list.length > 0).toBeTruthy()

  })

  test('projects-basic-load', async () => {
    if (!ENV) return;
    if (!CONFIG) return;

    const seneca = await makeSeneca()

    const load = await seneca.entity("provider/vercel/projects").load$(CONFIG.VERCEL_PROJECT_ID)
    expect('object' === typeof load).toBeTruthy()

  })

  // IMPORTANT: This test creates a real project on Vercel. There is no SandBox on Vercel (09-06-2022).
  // TODO: find a way to simulate this
  // test('projects-basic-save', async () => {
  //   if (!ENV) return;
  //   if (!CONFIG) return;

  //   const seneca = await makeSeneca()

  //   const save = await seneca.entity("provider/vercel/projects").save$(CONFIG.VERCEL_PROJECT_NAME)
  //   expect('string' === typeof save.id).toBeTruthy()

  // })

})


async function makeSeneca() {
  const seneca = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity')
    .use('env', {
      // debug: true,
      file: [__dirname + '/local-env.js;?'],
      var: {
        $VERCEL_USERTOKEN: String
      }
    })
    .use('provider', {
      provider: {
        vercel: {
          keys: {
            usertoken: { value: ENV.VERCEL_USERTOKEN },
            projectname: { value: CONFIG.VERCEL_PROJECT_NAME }
          }
        }
      }
    })
    .use(VercelProvider)

  return seneca.ready()
}
