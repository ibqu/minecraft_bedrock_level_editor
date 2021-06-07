function buf2obj(input_buffer) {

    //buffer containing decompressed data
    var buffer = input_buffer.slice(8, input_buffer.byteLength);
    var buffer_length = buffer.byteLength;
    var view = new DataView(buffer);
    var pos = 0;

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
            if (id === 0 && length > 0)
                throw new Error("List of end tags found");
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

    return value;
}
