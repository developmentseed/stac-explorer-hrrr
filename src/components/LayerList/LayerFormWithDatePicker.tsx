import { useCallback, useMemo, useState } from "react";
import { LayerConfig, StacCollection } from "../../types";
import { FormControl, FormErrorMessage, FormLabel } from "@chakra-ui/react";
import { SingleDatepicker } from "chakra-dayzed-datepicker";
import DateTimeSlider from "../generic/DateTimeSlider";
import { getMostRecentUTC } from "../../utils";

type Props = {
  config: LayerConfig;
  collection: StacCollection;
  updateLayer: (config: LayerConfig) => void;
}

function LayerFormWithDatePicker({ config, collection, updateLayer }: Props) {
  const [timeMin, timeMax] = collection.extent.temporal.interval[0];
  const minDate = useMemo(() => new Date(timeMin ? Date.parse(timeMin) : 0), [timeMin]);
  const maxDate = useMemo(() => new Date(timeMax ? Date.parse(timeMax) : getMostRecentUTC()), [timeMax]);
  // TODO: can't figure out how not to default to local time zone, so the datepicker is on my local time zone but the slider starts on UTC.
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(maxDate);
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(maxDate);
  const [dateError, setDateError] = useState<string>('');

  const onChange = useCallback((date: Date | null, startDateChange: Boolean = false) => {
    if (!date) {
      setDateError('Please select a valid date.');
      return;
    }

    setDateError('');
    // on option is to use ISOString and replace the timezone with 00:00, but this doesn't work for the date picker, only the slider.

    if (startDateChange) {
      // the selected date will be in the local timezone, so we need to convert it to UTC.
      const isoString = date.toISOString();
      const updatedIsoString = isoString.replace(/(\d{2}:\d{2})/, "00:00");      
      let utcDate = new Date(updatedIsoString);
      setSelectedDate(utcDate);
      setSelectedStartDate(utcDate);
    } else {
      setSelectedDate(date);
    }

    updateLayer({
      ...config,
      renderConfig: {
        ...config.renderConfig,
        datetime_str: date.toISOString(),
        // if the start date has changed (from the date picker) use the date value, otherwise use the existing selected start date.
        reference_dt_str: startDateChange ? date.toISOString() : selectedStartDate?.toISOString(),
      },
    });
  }, [config, updateLayer, selectedStartDate]);

  return (
    <FormControl isInvalid={!!dateError}>
      <FormLabel as="div">Select Date</FormLabel>
      <SingleDatepicker
        // the start date is in UTC which will be converted to the date of the local time zone, so may appear off by one day.
        // modify the selected date to be date +/- timezone offset, so the date in the picker matches UTC date in time slider
        date={new Date(selectedStartDate.getTime() + selectedStartDate.getTimezoneOffset() * 60 * 1000)}
        onDateChange={(v) => onChange(v, true)}
        minDate={minDate}
        maxDate={maxDate}
        usePortal
      />
      {selectedDate && selectedStartDate && (
        // may be able to simplify this by removing onChangeEnd?
        <DateTimeSlider
          min={selectedStartDate}
          // TODO: assumes the 48 hour forecast
          max={new Date(selectedStartDate.getTime() + 2 * 60 * 60 * 24 * 1000)}
          // TODO: depends on if it's a forecast or historical
          step="PT1H"
          aria-labelledby="testing"
          value={selectedDate}
          onChange={(d) => onChange(new Date(d))}
          onChangeEnd={(d) => onChange(new Date(d))}
        />
      )}      
      <FormErrorMessage>{dateError}</FormErrorMessage>
    </FormControl>
  );
}

export default LayerFormWithDatePicker;
