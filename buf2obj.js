function buf2obj(buffer) {
    var view = new DataView(buffer);
    var buffer_length = buffer.byteLength;
    var pos = 0;

    //get the level.dat version number
    var version_number = view.getUint32(pos, true);
    pos += 4;
    //skip the number indicating the length of the file's body
    pos += 4;

    function get_id() {
        var id = view.getUint8(pos, true);
        ++pos;
        return id;
    }

    function get_name() {
        var name_length = view.getUint16(pos, true);
        pos += 2;
        var name = "";
        for (var i = 0; i < name_length; ++i) {
            name += String.fromCharCode(view.getUint8(pos, true));
            ++pos;
        }
        return name;
    }

    var tag_types = "end byte short int long float double byte_array string list compound int_array long_array".split(" ");
    //note that 64 bit ints are represented as strings
    var nameless_readers = {
        "1": function () { var value = view.getInt8(pos, true); pos += 1; return value; },
        "2": function () { var value = view.getInt16(pos, true); pos += 2; return value; },
        "3": function () { var value = view.getInt32(pos, true); pos += 4; return value; },
        "4": function () { var value = view.getBigInt64(pos, true).toString(); pos += 8; return value; },
        "5": function () { var value = view.getFloat32(pos, true); pos += 4; return value; },
        "6": function () { var value = view.getFloat64(pos, true); pos += 8; return value; },
        "7": function () {
            var length = view.getInt32(pos, true);
            pos += 4;
            var value = [];
            for (var i = 0; i < length; ++i) {
                value.push(nameless_readers[1]());
            }
            return value;
        },
        "8": function () {
            var length = view.getUint16(pos, true);
            pos += 2;
            var value = "";
            for (var i = 0; i < length; ++i) {
                value += String.fromCharCode(view.getUint8(pos, true));
                ++pos;
            }
            return value;
        },
        "9": function () {
            var id = get_id();
            var length = view.getInt32(pos, true);
            pos += 4;
            var entry = { "id": id };
            var value = entry.value = [];
            for (var i = 0; i < length; ++i) {
                value.push(nameless_readers[id]());
            }
            return entry;
        },
        "10": function () {
            var value = [];
            var id = get_id();
            while (id) {
                var name = get_name();
                var entry = { "type": tag_types[id], "name": name };
                if (id !== 9) {
                    entry.value = nameless_readers[id]();
                } else {
                    var temp_entry = nameless_readers[id]();
                    entry.id = temp_entry.id;
                    entry.value = temp_entry.value;
                }
                value.push(entry);
                id = get_id();
            }
            return value;
        },
        "11": function () {
            var value = [];
            var length = view.getInt32(pos, true);
            pos += 4;
            for (var i = 0; i < length; ++i) {
                value.push(nameless_readers[3]());
            }
            return value;
        },
        "12": function () {
            var value = [];
            var length = view.getInt32(pos, true);
            pos += 4;
            for (var i = 0; i < length; ++i) {
                value.push(nameless_readers[4]());
            }
            return value;
        }
    };

    var value = [];
    while (pos < buffer_length) {
        var id = get_id();
        var name = get_name();
        var entry = { "type": tag_types[id], "name": name };
        if (id !== 9) {
            entry.value = nameless_readers[id]();
        } else {
            var temp_entry = nameless_readers[id]();
            entry.id = temp_entry.id;
            entry.value = temp_entry.value;
        }
        value.push(entry);
    }

    var obj = { "version": version_number, "data": value };

    return obj;
}
