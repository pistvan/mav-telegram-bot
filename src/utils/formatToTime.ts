import { DateTime } from "luxon";

export default (date: Date) => DateTime.fromJSDate(date).toLocaleString(DateTime.TIME_24_SIMPLE);
