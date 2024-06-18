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

  // TODO: can't figure out how not to default to local time zone, so the datepicker is on my local time zone but the
  // slider is on UTC.
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(maxDate);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(selectedDate);
  const [dateError, setDateError] = useState<string>('');

  const onChange = useCallback((date: Date | null, start_date_change: Boolean = false) => {
    if (!date) {
      setDateError('Please select a valid date.');
      return;
    }

    setDateError('');
    setSelectedDate(date);

    if (start_date_change) {
      setSelectedStartDate(date);
    }

    updateLayer({
      ...config,
      renderConfig: {
        ...config.renderConfig,
        datetime_str: date.toISOString(),
        reference_dt_str: selectedStartDate?.toISOString(),
      },
    });
  }, [config, updateLayer, selectedStartDate]);

  return (
    <FormControl isInvalid={!!dateError}>
      <FormLabel as="div">Select Date</FormLabel>
      <SingleDatepicker
        date={selectedStartDate}
        onDateChange={(v) => onChange(v, true)}
        minDate={minDate}
        maxDate={maxDate}
        usePortal
      />
      {selectedDate && selectedStartDate && (
        // may be able to simplify this by removing onChangeEnd?
        <DateTimeSlider
          min={selectedStartDate}
          // assumes the 48 hour forecast
          max={new Date(selectedStartDate.getTime() + 2 * 60 * 60 * 24 * 1000)}
          // depends on if it's a forecast or historical
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
