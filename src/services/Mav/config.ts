import { IANAZone } from "luxon";

/**
 * Returns the timezone from the environment variable or the default timezone.
 */
const getTimezone = (defaultValue: string): IANAZone<true> => {
    const envTimezone = process.env.MAV_TIMEZONE;

    if (envTimezone) {
        const timezone = IANAZone.create(envTimezone);

        if (timezone.isValid) {
            return timezone;
        }

        console.error(`Invalid timezone: ${envTimezone}, will use the default timezone: ${defaultValue}`);
    }

    const timezone = IANAZone.create(defaultValue);

    if (!timezone.isValid) {
        throw new Error('Invalid default timezone');
    }

    return timezone;
}

export const ElviraBaseUri = 'https://jegy-a.mav.hu/IK_API_PROD/api';

export const VonatinfoBaseUri = 'https://vonatinfo.mav-start.hu/map.aspx';

export const ElviraTimezone = getTimezone('Europe/Budapest');
