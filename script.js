/*Plan:
For open_file:
    TRY showing the open file picker and reading the file
    
    Convert the important parts (i.e without zlib header) into a dataview.

    Write and TRY to use a function to convert this to an object.
    Int64 values should be represented as strings, as BigInts cannot be serialised in JSON.

    Set the json_textarea element's value to a pretty printed stringified version of the object

    Indicate that loading the file was successful

For save_file:
    TRY showing the save file picker and getting the file to write to
    
    Get the JSON text and TRY to convert it to an object

    Write and use a function to TRY to convert this into an arraybuffer

    TRY to write the arraybuffer contents to the file

    Indicate that saving the file was successful
*/

var json_textarea = null;
var message_element = null;

async function open_file() {
    try {
        var [file_handle] = await showOpenFilePicker({
            "types": [
                {
                    "description": "DAT files",
                    "accept": {
                        "d/at": [".dat"]
                    }
                }
            ]
        });
    } catch (e) {
        write_message("Failed to select file to open");
        return;
    }

    try {
        var file = await file_handle.getFile();
    } catch (e) {
        write_message("Failed to read file");
        return;
    }

    try {
        var buffer = await file.arrayBuffer();
    } catch (e) {
        write_message("Failed to read file as ArrayBuffer");
        return;
    }

    try {
        var obj = buf2obj(buffer);
    } catch (e) {
        write_message("Failed to parse level editor");
        return;
    }

    json_textarea.innerHTML = JSON.stringify(obj, null, 2);

    write_message("Success!");
}

async function save_file() {

}

function write_message(m) {
    message_element.innerHTML = m;
}

onload = function () {
    document.getElementById("open_file").onclick = open_file;
    document.getElementById("save_file").onclick = save_file;
    json_textarea = document.getElementById("json_textarea");
    message_element = document.getElementById("message_element");
}