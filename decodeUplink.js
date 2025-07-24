function decodeUplink(input) { // This function is for ChirpStack v4
  var bytes = input.bytes
  var port = input.fPort
  
  var params = {};

  if(10 == port) {  // Sensor readings are on port 10
    for (var i = 0; i < bytes.length; i++) {
    
        // battery voltage
        if(0x00 === bytes[i] && 0xFF === bytes[i+1]) {
            params.battery_voltage = 0.01 * ((bytes[i+2] << 8) | bytes[i+3]);
            i = i+3;
        }

        // soil moisture - built in probe version
        if(0x01 === bytes[i] && 0x04 === bytes[i+1]) { 
            var soil_moisture_raw = (bytes[i+2] << 8) | bytes[i+3];
            params.soil_moisture_raw = soil_moisture_raw;
            
            // Calculate Gravimetric Water Content
            if (soil_moisture_raw >= 1399){
                params.soil_gwc = 0;
            } else if(soil_moisture_raw >= 1396) {
                params.soil_gwc = 0.1;
            } else if(soil_moisture_raw >= 1391) {
                params.soil_gwc = 0.2;
            } else if(soil_moisture_raw >= 1386) {
                params.soil_gwc = 0.3;
            } else if(soil_moisture_raw >= 1381) {
                params.soil_gwc = 0.4;
            } else if(soil_moisture_raw >= 1376) {
                params.soil_gwc = 0.5;
            } else if(soil_moisture_raw >= 1371) {
                params.soil_gwc = 0.6;
            } else if(soil_moisture_raw >= 1366) {
                params.soil_gwc = 0.7;
            } else if(soil_moisture_raw >= 1361) {
                params.soil_gwc = 0.8;
            } else if(soil_moisture_raw >= 1356) {
                params.soil_gwc = 0.9;
            } else if(soil_moisture_raw >= 1351) {
                params.soil_gwc = 1;
            } else if(soil_moisture_raw >= 1346) {
                params.soil_gwc = 1.1;
            } else if(soil_moisture_raw >= 1341) {
                params.soil_gwc = 1.2;
            } else {
                params.soil_gwc = 2;
            }
            i = i+3;
        }

        // soil temp - built in probe version
        if(0x02 === bytes[i] && 0x02 === bytes[i+1]) {

            // raw value in mV
            var soil_temp_raw = (bytes[i+2] << 8) | bytes[i+3];
            params.soil_temp_raw = soil_temp_raw;

            // convert to degrees C
            params.soil_temp = -32.46 * Math.log(soil_temp_raw) + 236.36
            i = i+3;
        }
        
        // watermark reading 1 - external probe version
        if(0x05 === bytes[i] && 0x04 === bytes[i+1]) {
            params.soil_moisture_raw1 = (bytes[i+2] << 8) | bytes[i+3]; //hz
            params.soil_water_tension1 = convert_watermark(params.soil_moisture_raw1);
            i = i+3;
        }
        
        // watermark reading 2 - external probe version
        if(0x06 === bytes[i] && 0x04 === bytes[i+1]) {
            params.soil_moisture_raw2 = (bytes[i+2] << 8) | bytes[i+3]; //hz
            params.soil_water_tension2 = convert_watermark(params.soil_moisture_raw2);
            i = i+3;
        }
        
        // ambient light, in lux
        if(0x09 === bytes[i] && 0x65 === bytes[i+1]) {
            params.ambient_light = (bytes[i+2] << 8) | bytes[i+3];
            i = i+3;
        }
        
        // ambient temperature, in degrees C
        if(0x0B === bytes[i] && 0x67 === bytes[i+1]) {
            // Sign-extend to 32 bits to support negative values, by shifting 24 bits
            // (16 too far) to the left, followed by a sign-propagating right shift:
            params.ambient_temp = (bytes[i+2]<<24>>16 | bytes[i+3]) / 10;
            i = i+3;
        }

        // humidity
        if(0x0B === bytes[i] && 0x68 === bytes[i+1]) {
            params.ambient_humidity = 0.5 * bytes[i+2];
            i = i+2;
        }
        
    }
  }
  
  return {data: params}

}

function convert_watermark(hz) {
    var water_tension;
    
    if(hz < 293) {
        water_tension = 200;
    } else if(hz <= 485) {
        water_tension = 200 - (hz - 293) * 0.5208;
    } else if(hz <= 600) {
        water_tension = 100 - (hz - 485) * 0.2174;
    } else if(hz <= 770) {
        water_tension = 75 - (hz - 600) * 0.1176;
    } else if(hz <= 1110) {
        water_tension = 55 - (hz - 770) * 0.05884;
    } else if(hz <= 2820) {
        water_tension = 35 - (hz - 1110) * 0.01170;
    } else if(hz <= 4330) {
        water_tension = 15 - (hz - 2820) * 0.003974;
    } else if(hz <= 6430) {
        water_tension = 9 - (hz - 4330) * 0.004286;
    } else if(hz > 6430) {
        water_tension = 0;
    }
    
    return water_tension;
}
