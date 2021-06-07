function obj2buf(obj) {
    //scope: valid object representations of level.dat files
    var tag_types = "end byte short int long float double byte_array string list compound int_array long_array".split(" ");
    var type_ids = {};
    for (var i = 0; i < tag_types.length; ++i) {
        type_ids[tag_types[i]] = i;
    }

    var scratchpad_buffer = new ArrayBuffer(8);
    var scratchpad = new DataView(scratchpad_buffer);
    var scratch_bytes = new Uint8Array(scratchpad_buffer);
    var bytes = [];

    //data types which you might need to write:
    //uint8, uint16, uint32, int8, int16, int32, int64, float32, float64, char
    function write_uint8(a) {
        scratchpad.setUint8(0, a, true);
        for (var i = 0; i < 1; ++i) {
            bytes.push(scratch_bytes[i]);
        }
    }

    function write_uint16(a) {
        scratchpad.setUint16(0, a, true);
        for (var i = 0; i < 2; ++i) {
            bytes.push(scratch_bytes[i]);
        }
    }

    function write_uint32(a) {
        scratchpad.setUint32(0, a, true);
        for (var i = 0; i < 4; ++i) {
            bytes.push(scratch_bytes[i]);
        }
    }

    function write_int8(a) {
        scratchpad.setInt8(0, a, true);
        for (var i = 0; i < 1; ++i) {
            bytes.push(scratch_bytes[i]);
        }
    }

    function write_int16(a) {
        scratchpad.setInt16(0, a, true);
        for (var i = 0; i < 2; ++i) {
            bytes.push(scratch_bytes[i]);
        }
    }

    function write_int32(a) {
        scratchpad.setInt32(0, a, true);
        for (var i = 0; i < 4; ++i) {
            bytes.push(scratch_bytes[i]);
        }
    }

    function write_int64(a) {
        scratchpad.setBigInt64(0, BigInt(a), true);
        for (var i = 0; i < 8; ++i) {
            bytes.push(scratch_bytes[i]);
        }
    }

    function write_float32(a) {
        scratchpad.setFloat32(0, a, true);
        for (var i = 0; i < 4; ++i) {
            bytes.push(scratch_bytes[i]);
        }
    }

    function write_float64(a) {
        scratchpad.setFloat64(0, a, true);
        for (var i = 0; i < 8; ++i) {
            bytes.push(scratch_bytes[i]);
        }
    }

    function write_chars(a) {
        for (var i = 0; i < a.length; ++i) {
            bytes.push(a.charCodeAt(i));
        }
    }

    function write_id_and_name(id, name) {
        write_uint8(id);
        write_uint16(name.length);
        write_chars(name);
    }

    var nameless_writers = {
        "1": write_int8,
        "2": write_int16,
        "3": write_int32,
        "4": write_int64,
        "5": write_float32,
        "6": write_float64,
        "7": function (array) {
            write_int32(array.length);
            for (var i = 0; i < array.length; ++i) {
                write_int8(array[i]);
            }
        },
        "8": function (string) {
            write_uint16(string.length);
            write_chars(string);
        },
        "9": function (list_obj) {
            write_uint8(list_obj.id);
            write_int32(list_obj.value.length);
            for (var i = 0; i < list_obj.value.length; ++i) {
                nameless_writers[list_obj.id](list_obj.value[i]);
            }
        },
        "10": function (tags) {
            for (var i = 0; i < tags.length; ++i) {
                var entry_id = type_ids[tags[i].type];
                write_id_and_name(entry_id, tags[i].name);
                if (tags[i].type !== "list") {
                    nameless_writers[entry_id](tags[i].value);
                } else {
                    nameless_writers[entry_id](tags[i]);
                }
            }
            write_uint8(0);
        },
        "11": function (array) {
            write_int32(array.length);
            for (var i = 0; i < array.length; ++i) {
                write_int32(array[i]);
            }
        },
        "12": function (array) {
            write_int64(array.length);
            for (var i = 0; i < array.length; ++i) {
                write_int64(array[i]);
            }
        }
    };

    //add version number
    write_uint32(obj["version"]);

    //put in a placeholder for the file size
    write_uint32(0);

    //put in all of the tags
    nameless_writers["10"](obj["data"])
    //remove the end tag added by this function
    bytes.pop();

    //set the file length part
    scratchpad.setUint32(0, bytes.length - 8, true);
    for (var i = 0; i < 4; ++i) {
        bytes[i + 4] = scratch_bytes[i];
    }

    //return an arraybuffer
    return (new Uint8Array(bytes)).buffer
}
