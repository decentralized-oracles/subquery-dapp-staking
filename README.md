# SubQuery - Index dApps and stakers for dApps Staking 

This project index all data coming from dApps Staking

## Preparation

#### Environment

- [Typescript](https://www.typescriptlang.org/) are required to compile project and define types.

- Both SubQuery CLI and generated Project have dependencies and require [Node](https://nodejs.org/en/).

#### Install the SubQuery CLI

Install SubQuery CLI globally on your terminal by using NPM:

```
npm install -g @subql/cli
```

Run help to see available commands and usage provide by CLI

```
subql help
```

## Clone the project

Inside the directory in which you want to create the SubQuery project, clone the project.

```
git clone https://github.com/decentralized-oracles/subquery-dapp-staking.git
```

Then you should see a folder with your project name has been created inside the directory, you can use this as the start point of your project. And the files should be identical as in the [Directory Structure](https://doc.subquery.network/directory_structure.html).

## Install the dependencies

```
yarn install
```

## Configure your project

In this package, an simple example of a project configuration has been provided. You will be mainly working on the following files:

- The Manifest in `project.yaml`
- The GraphQL Schema in `schema.graphql`
- The Mapping functions in `src/mappings/` directory

For more information on how to write the SubQuery,
check out our doc section on [Define the SubQuery](https://doc.subquery.network/define_a_subquery.html)

#### Code generation

In order to index your SubQuery project, it is mandatory to build your project first.
Run this command under the project directory.

```
yarn codegen --file ./project-astar.yaml
```

## Build the project

In order to deploy your SubQuery project to our hosted service, it is mandatory to pack your configuration before upload.
Run pack command from root directory of your project will automatically generate a `your-project-name.tgz` file.

```
yarn build
```

## Indexing and Query

#### Run required systems in docker

Under the project directory run following command:

```
yarn start:docker
```

#### Query the project

Open your browser and head to `http://localhost:3000`.

Finally, you should see a GraphQL playground is showing in the explorer and the schemas that ready to query.

Sample graphql query:

Query a specific dApp and display the stakers with their stake
```graphql
query{
    dApps (
      filter: {
        id: {
          inInsensitive: ["..."]
        }
      } 
    ){
      nodes {
        id
        accountId
        registered
        stakes (
          filter: { totalStake : {notEqualTo: "0"} } 
        ){
          totalCount
          aggregates{ sum {totalStake} }
          nodes{
            accountId
            totalStake
          }
        }
      }
    }
}
```

Query a specific staker and display its stakes 
```graphql
query{
    accounts (
        filter: {
            id: {
                equalTo: "..."
            }
        }
    ){
        nodes {
            id
                stakes ( filter: { totalStake : {notEqualTo: "0"} }  ){
                totalCount
                aggregates{sum{totalStake}}
                nodes{
                    dAppId
                    totalStake
                   dApp {registered}
                }
            }
        }
    }
}
```

Total staked in dAppsStaking and all dApps with the number of stakers and total staked in the dApp
```graphql
query{
    stakes {
        aggregates {sum{totalStake}}
    }
    dApps {
        totalCount
        nodes {
            id
            accountId
            registered
            stakes {
                totalCount
                aggregates{sum{totalStake}}
            }
        }
    }
}
```
