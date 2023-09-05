# json-cloak

Replace UUIDs in your JSON files and JS objects with new UUIDs while preserving references.

`json-cloak` provides a command-line interface for transforming JSON files, as well as a function to use in JavaScript projects to transform individual JS objects. Identical UUIDs are replaced with the same UUID.

## CLI Usage

### Installation

The simplest way to use `json-cloak` is to invoke via `npx`:

```bash
npx json-cloak [options]
```
Alternatively, you can install `json-cloak` globally as a CLI:

```bash
# npm
npm install -g json-cloak

# yarn
yarn global add json-cloak
```
**Note**: The npm package name is `json-cloak`, however the globally installed binary name is just `cloak`

### Command

```
cloak [options]
```

#### Options

- `-f, --file`:     Specify the JSON file to transform.
- `-i, --in-place`: Update the file in place with the transformed JSON object.
- `-k, --keys`:     Display the replaced keys instead of printing the transformed JSON object.
- `-v, --version`:  Display the version number.
- `-p, --pattern`:  Specify a glob pattern to operate on multiple files. This will perform updates **in place**!
- `-q, --quiet`:    Don't print to stdout
- `-h, --help`:     Show the help message.

#### Examples

1. Update the JSON file in place with the transformed content:

```bash
cloak -i -f data.json
```

2. Display the keys that would be replaced for the given JSON file:

```bash
cloak -k -f data.json
```

3. Use a glob pattern to transform multiple files (**in place transformation only**):
```bash
cloak -p 'test/*.json' -f other/dir/foo.json
```

4. Display version info:

```bash
cloak -v
```

## Library Usage

In addition to being used as a CLI, `json-cloak` can also be used inside JavaScript projects to transform individual JSON objects. Use either as CommonJS or ES6 module.

### Installation

```bash
npm install json-cloak
```
or 

```bash
yarn add json-cloak
```

### Example

```javascript
// CommonJS
// const { cloak } = require('json-cloak')

// ES6
import { cloak } from 'json-cloak'

const user = {
  id: 'a025c322-78af-4a23-8c27-e05a42be620e',
  name: 'Javier',
  age: 30,
  friends: [
    {
      id: '80b96ced-ad77-4a9a-b758-a04e5988d093',
      name: 'Sam',
      age: 35,
      friends: [
        {
          id: 'a025c322-78af-4a23-8c27-e05a42be620e',
          name: 'Javier',
          age: 30,
        } 
      ]
    } 
  ]
}

const transformedObject = cloak(user)

console.log(JSON.stringify(transformedObject, null, 2))
// {
//   "id": "08cb9bb4-65b4-4706-88ef-97f97d208b37",
//   "name": "Javier",
//   "age": 30,
//   "friends": [
//     {
//       "id": "6864205d-fcb2-49be-9c97-133379670e1a",
//       "name": "Sam",
//       "age": 35,
//       "friends": [
//         {
//           "id": "08cb9bb4-65b4-4706-88ef-97f97d208b37",
//           "name": "Javier",
//           "age": 30
//         }
//       ]
//     }
//   ]
// }

```

## Contributing

Contributions are welcome, please open an issue or submit a pull request!

---
