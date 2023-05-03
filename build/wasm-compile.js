"use strict";
const { exec } = require('child_process');
const fs = require('fs');
const command = 'asc index.ts -b warp.wasm'; // replace with your desired command
const outputFile = 'warp.wasm'; // replace with your desired output file name
exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    // Write the command output to the output file
    fs.writeFile(outputFile, stdout, (err) => {
        if (err) {
            console.error(`Error writing output to file: ${err}`);
            return;
        }
        console.log(`Command output written to ${outputFile}`);
    });
});
//# sourceMappingURL=wasm-compile.js.map