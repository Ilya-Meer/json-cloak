#!/usr/bin/env node

import { main } from './cli'

main()
  .catch((err: Error) => {
    process.stdout.write(err.message)
    process.exit(1)
  })
