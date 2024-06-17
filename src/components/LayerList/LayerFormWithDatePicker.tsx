import { useCallback, useMemo, useState } from "react";
import { LayerConfig, StacCollection } from "../../types";
import { FormControl, FormErrorMessage, FormLabel } from "@chakra-ui/react";
import { SingleDatepicker } from "chakra-dayzed-datepicker";
import DateTimeSlider from "../generic/DateTimeSlider";
// import { durationToMs } from "../../utils";

type Props = {
  config: LayerConfig;
  collection: StacCollection;
  updateLayer: (config: LayerConfig) => void;
}

function LayerFormWithDatePicker({ config, collection, updateLayer }: Props) {
  const [timeMin, timeMax] = collection.extent.temporal.interval[0];
  const minDate = useMemo(() => new Date(timeMin ? Date.parse(timeMin) : 0), [timeMin]);
  const maxDate = useMemo(() => new Date(timeMax ? Date.parse(timeMax) : Date.now()), [timeMax]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(config.renderConfig.datetime ? new Date(Date.parse(config.renderConfig.datetime)) : undefined);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(selectedDate);
  const [dateError, setDateError] = useState<string>('');

  const onChange = useCallback((date: Date | null, change_start: Boolean = false) => {
    if (!date) {
      setDateError('Please select a valid date.');
      return;
    }

    setDateError('');
    setSelectedDate(date);
    if (change_start) {
      setSelectedStartDate(date);
    }
    updateLayer({
      ...config,
      renderConfig: {
        ...config.renderConfig,
        datetime: date.toISOString(),
      },
    });
  }, [config, updateLayer]);
  return (
    <FormControl isInvalid={!!dateError}>
      <FormLabel as="div">Select Date</FormLabel>
      <SingleDatepicker
        date={selectedDate}
        onDateChange={(v) => onChange(v, true)}
        minDate={minDate}
        maxDate={maxDate}
        usePortal
      />
      {selectedDate && selectedStartDate && (
        // may be able to simplify this by removing onChangeEnd?
        <DateTimeSlider
          min={selectedStartDate.toISOString()}
          max={new Date(selectedStartDate.getTime() + 2 * 60 * 60 * 24 * 1000).toISOString()}
          step="PT1H"
          aria-labelledby="testing"
          value={selectedDate.toISOString()}
          onChange={(d) => onChange(new Date(d))}
          onChangeEnd={(d) => onChange(new Date(d))}
        />
      )}      
      <FormErrorMessage>{dateError}</FormErrorMessage>
    </FormControl>
  );
}

export default LayerFormWithDatePicker;
