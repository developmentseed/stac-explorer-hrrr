import { useCallback, useMemo, useState } from "react";
import { LayerConfig, StacCollection, CollectionConfig } from "../../types";
import { FormControl, FormErrorMessage, FormLabel, FormHelperText } from "@chakra-ui/react";
import { SingleDatepicker } from "chakra-dayzed-datepicker";
import DateTimeSlider from "../generic/DateTimeSlider";
import { getMostRecentUTC } from "../../utils";

type Props = {
  config: LayerConfig;
  collection: StacCollection;
  updateLayer: (config: LayerConfig) => void;
  collectionConfig: CollectionConfig;
}

function LayerFormWithDatePicker({ config, collection, collectionConfig, updateLayer }: Props) {
  const timeMin = collection.extent.temporal.interval[0][0];
  const timeMax = collection.extent.temporal.interval[0][1] || collectionConfig.lastAvaliableDatetime;
  const minDate = useMemo(() => new Date(timeMin ? Date.parse(timeMin) : 0), [timeMin]);
  // We may never fall back to getMostRecentUTC unless we have a real-time ingestion pipeline.
  const maxDate = useMemo(() => new Date(timeMax ? Date.parse(timeMax) : getMostRecentUTC()), [timeMax]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(maxDate);
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(maxDate);
  const [dateError, setDateError] = useState<string>('');

  const onChange = useCallback((date: Date | null, startDateChange: Boolean = false) => {
    if (!date) {
      setDateError('Please select a valid date.');
      return;
    }

    setDateError('');

    // the selected date will be in the local timezone, e.g. select "06/19/2024" will be midnight in the local timezone (of the users computer)
    // This is a workaround to convert the date to midnight UTC by replacing the timezone offset with 00:00.
    const isoString = date.toISOString();
    const updatedIsoString = isoString.replace(/(\d{2}:\d{2})/, "00:00");
    const utcDate = new Date(updatedIsoString);

    if (startDateChange) {
      // change both the start date and the selected date to midnight UTC.
      setSelectedDate(utcDate);
      setSelectedStartDate(utcDate);
    } else {
      // if it's not a start date change, the slider correctly maintains the date in UTC.
      setSelectedDate(date);
    }
    const datetimeStr = (startDateChange ? utcDate.toISOString() : date.toISOString()).replace('.000Z', 'Z');
    const referenceDtStr = (startDateChange ? utcDate.toISOString() : selectedStartDate.toISOString()).replace('.000Z', 'Z');
    updateLayer({
      ...config,
      renderConfig: {
        ...config.renderConfig,
        datetimeStr,
        // if the start date has changed (from the date picker) use the date value, otherwise use the existing selected start date.
        referenceDtStr,
      },
    });
  }, [config, updateLayer, selectedStartDate]);

  return (
    <FormControl isInvalid={!!dateError}>
      <FormLabel as="div">Select Date</FormLabel>
      <SingleDatepicker
        // The start date is in UTC which will be converted to the date of the local time zone, so may appear off by one day.
        // Modify the selected date to be date +/- timezone offset, so the date in the picker matches UTC date in time slider.
        date={new Date(selectedStartDate.getTime() + selectedStartDate.getTimezoneOffset() * 60 * 1000)}
        onDateChange={(v) => onChange(v, true)}
        minDate={minDate}
        maxDate={maxDate}
        usePortal
      />
      <FormHelperText>Displaying hourly forecasts for 48 hours starting at midnight UTC for the selected date.</FormHelperText>
      {selectedDate && selectedStartDate && (
        // may be able to simplify this by removing onChangeEnd?
        <DateTimeSlider
          min={selectedStartDate}
          // TODO: assumes the 48 hour forecast
          max={new Date(selectedStartDate.getTime() + 2 * 60 * 60 * 24 * 1000)}
          // TODO: step depends on if it's a forecast or historical, but we're only handling forecasts for now.
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
