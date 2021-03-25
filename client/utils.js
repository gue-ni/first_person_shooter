
export class Utils {
    static clamp(value, lower, upper){
        if (value > upper) value = upper;
        if (value < lower) value = lower;
        return value;
    }
}