# WarpVS

## `This extension works just on Linux and MacOS since Warp only have support for this two platforms`

## Description

WarpVS extension provides a convenient and efficient way for developers to migrate from Solidity to Cairo-1.0, [Nethermind/Warp](https://github.com/NethermindEth/warp) is a transpiler that enables the conversion of Ethereum smart contracts into Starknet Cairo Contracts. With the WarpVS extension, developers can seamlessly access and utilize Warp's functionality directly within the VSCode environment with just one click, allowing for a streamlined and integrated development experience. This extension is an essential tool for any developer looking to take advantage of Cairo-1.0 capabilities and maximize their efficiency in developing smart contracts for Starknet. Currently the extension has just the transpilation functionality. This extension is based on the `cairo-1.0` branch of Warp transpiler repository, this branch is still in development so the extension is not ready for production yet.


## How it was made?

### Initial extension architecture:

The Warp extension front-end (the `Transpile` button) is made using Svelte and the extension code is written in Typescript.  
Initially the Warp Typescript code base was put in the same place as the extension code, so the communication between the extension and the Warp transpiler was made basically by function calls, but this rise a great performance problem taking minutes or maybe hours to load the extension since the Warp codebase was too large to be loaded on VSCode.

### Attempts to solve the performance problem:

Initially I tried to solve the problem by just compiling the extension using Deno, but the problem is that it was needed to adapt all the Warp code base and in the process losing a lot of Warp functionalities. Then my second attempt to solve the performance problem was by just compiling all the Warp codebase to WASM but this still has the same problems of the first attempt. so to solve the performance problem i have to dig a little bit deeper on how VSCode load his extensions, so i figure out the only the folder with the extension code is loaded by VScode, so when i put the Warp compiled (compiled to javascript by tsc) code in a different folder of the extension code, the extension loaded in just milliseconds, so i could reduce the load time from a lot of minutes maybe hours to just a few milliseconds, with that done the performance problem was solved and the best part is that all the Warp functionalities can be used by the extension without the losing performance.

### New extension architecture:

In this new architecture the Warp compile code (compiled to Javascript by tsc) is put in the `build` folder and is called by the `warp` file inside the `bin` folder. in the old architecture of the extension the communication was made by function calls that lead to huge performance issues as mentioned in the previous section but in this new architecture the communication between the extension compiled code (compiled to javascript) and the Warp compiled code is made by function calls, so does not matter the size of the Warp, the extension will still load in milliseconds.

## How to use it?

`This extension works just on Linux and MacOS since Warp only have support for this two platforms`

### installation:

The transpilation functionalities in this extension are based on the code from the `cairo-1.0` branch from `Nethermind/Warp` that is still under development therefore this extension will still be under development as well until Nethermind releases the official version of Warp with fully support for Cairo-1 and for this reason is not available in the VSCode marketplace yet, but you can install the extension locally by just following the steps bellow:

1 - Clone the repo:

```shell
git clone https://github.com/esdras-santos/WarpVS
```

2 - Enter in the extension directory:

```shell
cd warpvs
```

3 - Then install locally:

```shell
code --install-extension warpvs-0.0.1.vsix
```

when you finish your installation on your side bar will appear this double sided arrow icon 
![warp icon](https://github.com/esdras-santos/WarpVS/readme-media/double-sized-arrow.PNG)


### Usage:

After the installation you can follow this steps to transpile your code with just one click:

1 - Go to a Solidity file.
2 - Click on the double sized arrow to open the extension.

![warp icon](https://github.com/esdras-santos/WarpVS/readme-media/double-sized-arrow.PNG)

3 - Click on `Transpile` button and wait between milliseconds to seconds (depending on the size of your contract), a warning will be popped up when your transpilation is done then just take a look on the new created `warpvs-output` folder and you’ll find your `Cairo-1.0` code.

![transpile button](https://github.com/esdras-santos/WarpVS/readme-media/transpile-button.PNG)

And it's done, you have transpiled your code.

## How to build this tool?

To create The extension code I followed the steps on the tutorial from [VSCode web site](https://code.visualstudio.com/api/get-started/your-first-extension). to create the front-end and the SidebarProvider you can get some help from this tutorial on [Youtube](https://youtu.be/a5DX5pQ9p5M). the front-end can be done with any front-end framework from javascript.

To get the warp compiled code, you can follow this steps:

1 - clone the Nethermind/Warp repository 
```shell
git clone https://github.com/NethermindEth/warp
```
2 - inside the warp directory, go to the `cairo-1.0` branch
```shell
git checkout cairo-1.0
```

3 - follow the Warp installation steps [Here](https://github.com/NethermindEth/warp/blob/develop/contributing.md#installation)

4 - after you finish the step 3, copy the folders `build`, `bin` and `nethersolc` to your extension directory outside the `src` folder from your extension.

Following these steps you can build your own Warp extension for VSCode.

## Future roadmap

In future updates i will add the option to declare and deploy your contract to mainnet or testnet using the WarpVS extension making it much more easy for developers to deploy their solutions to `StarkNet`.

## LICENSE

Begin license text.

Copyright 2023  Esdras Santos
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

End license text.
