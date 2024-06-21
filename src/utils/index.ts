import { parse } from "tinyduration";
import { StacRenderObject } from "../types";

export function renderConfigToUrlParams(config: StacRenderObject): string {
  const { title, assets, ...params } = config;

  const queryObj: { [key: string]: string } = {};

  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;

    if (Array.isArray(value) && key !== 'colormap') {
      queryObj[key] = value.join(',');
    } else if(key === 'colormap') {
      const jsonString = JSON.stringify(value);
      // URL-encode the JSON string
      queryObj[key] = jsonString; //encodeURIComponent(jsonString);
    }else {
      queryObj[key] = `${value}`;
    }
  }

  const searchParams = new URLSearchParams(queryObj);

  if (assets) {
    for (let i = 0, len = assets.length; i < len; i++) {
      searchParams.append('bands', assets[i]);
    }
  }

  return searchParams.toString();
}


export function durationToMs(duration: string): number {
  const { days, hours, minutes, seconds } = parse(duration);
  const interval = 
    (seconds || 0) * 1000 +
    (minutes || 0) * 60 * 1000 + 
    (hours || 0) * 60 * 60 * 1000 + 
    (days || 0) * 24 * 60 * 60 * 1000;
  return interval;
}

export function epochToDisplayDate(epoch?: number): string | undefined {
  return epoch ? new Date(epoch).toUTCString() : undefined;
}

export function convertToUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()));
}

export function getMostRecentUTC(): Date {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const month = now.getUTCMonth();
  const year = now.getUTCFullYear();

  let recentHour;

  if (currentHour >= 18) {
    recentHour = 18;
  } else if (currentHour >= 12) {
    recentHour = 12;
  } else if (currentHour >= 6) {
    recentHour = 6;
  } else {
    recentHour = 0;
  }

  const mostRecentDateTime = new Date(Date.UTC(year, month, now.getUTCDate(), recentHour));
  return mostRecentDateTime;
}

// Calculate the difference in hours
function getZeroPaddedHourDifference(date1: Date, date2: Date) {
  const hoursDifference = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60);
  // Convert to integer and pad with zeros
  return Math.floor(hoursDifference).toString().padStart(2, '0');
}


// !!! Temporary - to be replaced by STAC item search !!!
function formatDateComponent(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  return { year, month, day, hour };
}

export function generateVrtString(reference_dt_str: string, datetime_str: string, blobContainer: string = "https://noaahrrr.blob.core.windows.net/hrrr", product: string = 'sfc', grib_message: number = 9) {
  const reference_datetime = new Date(reference_dt_str);
  const datetime = new Date(datetime_str);
  const forecast_hour = getZeroPaddedHourDifference(datetime, reference_datetime);
  const { year, month, day, hour } = formatDateComponent(reference_datetime);

  const gribUrl = `${blobContainer}/hrrr.${year}${month}${day}/conus/hrrr.t${hour}z.wrf${product}f${forecast_hour}.grib2`;
  return `vrt:///vsicurl/${gribUrl}?bands=${grib_message}`;
}
