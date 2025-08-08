from rest_framework import serializers
from .models import Eto
from datetime import date
import math


class DailyClimateDataSerializer(serializers.Serializer):
    date = serializers.DateField()
    maximum_temperature = serializers.FloatField()
    minimum_temperature = serializers.FloatField()
    relative_humidity = serializers.FloatField()
    wind_speed = serializers.FloatField()
    sunshine_hours = serializers.FloatField()


class monthlyClimateDataSerializer(serializers.Serializer):
    month = serializers.IntegerField(min_value=1, max_value=12)
    maximum_temperature = serializers.FloatField()
    minimum_temperature = serializers.FloatField()
    relative_humidity = serializers.FloatField()
    wind_speed = serializers.FloatField()
    sunshine_hours = serializers.FloatField()


class EtoSerializer(serializers.ModelSerializer):

    data_frequency = serializers.ChoiceField(
        choices=["daily", "monthly"],
        required=True,
        write_only=True,
        help_text="Frequency of the data provided for the calculation of ETo",
    )

    daily_data = DailyClimateDataSerializer(
        many=True,
        required=False,
        write_only=True,
        help_text="Daily climate data for the calculation of ETo",
    )
    monthly_data = monthlyClimateDataSerializer(
        many=True,
        write_only=True,
        required=False,
        help_text="Monthly climate data for the calculation of ETo",
    )
    calculation_method = serializers.ChoiceField(
        choices=[
            "penman-monteith",
            "hargreaves",
            "turc",
            "makkink",
            "makkink-abstew",
            "simple-abstew",
            "priestley-taylor",
            "ivanov",
            "christiansen",
        ],
        help_text="Method to calculate the reference evapotranspiration",
        required=True,
    )

    eto_by_month = serializers.ListField(child=serializers.FloatField(), read_only=True)

    class Meta:
        model = Eto
        fields = (
            "id_eto",
            "country",
            "station_name",
            "altitude",
            "latitude",
            "longitude",
            "maximum_temperature_daily",
            "minimum_temperature_daily",
            "relative_humidity_daily",
            "wind_speed_daily",
            "sunshine_hours_daily",
            "average_max_temp",
            "average_min_temp",
            "average_relative_humidity",
            "average_wind_speed",
            "average_sunshine_hours",
            "reference_evapotranspiration",
            "calculation_method",
            "start_date",
            "end_date",
            "created_at",
            "data_frequency",
            "daily_data",
            "monthly_data",
            "eto_by_month",
        )

        read_only_fields = (
            "id_eto",
            "created_at",
            "reference_evapotranspiration",
            "average_max_temp",
            "average_min_temp",
            "average_relative_humidity",
            "average_wind_speed",
            "average_sunshine_hours",
        )
        extra_kwargs = {
            "country": {"required": True, "help_text": "Country name"},
            "station_name": {"required": True, "help_text": "station name"},
            "altitude": {
                "required": True,
                "help_text": "altitude in meters above sea level",
            },
            "latitude": {"required": True, "help_text": "latitude in decimal degrees"},
            "longitude": {
                "required": True,
                "help_text": "longitude in decimal degrees",
            },
            "start_date": {"required": True, "help_text": "start date (YYYY-MM-DD)"},
            "end_date": {"required": True, "help_text": "end date (YYYY-MM-DD)"},
        }

    def validate(self, data):

        freq = data.get("data_frequency")
        daily = data.get("daily_data")
        monthly = data.get("monthly_data")

        if freq == "daily" and not daily:
            raise serializers.ValidationError(
                "Daily data is required when data_frequency is 'daily'."
            )
        if freq == "monthly" and not monthly:
            raise serializers.ValidationError(
                "Monthly data is required when data_frequency is 'monthly'."
            )

        if freq == "daily":
            start_date = data["start_date"]
            end_date = data["end_date"]
            expected_days = (end_date - start_date).days + 1

            if len(daily) != expected_days:
                raise serializers.ValidationError(
                    f"the amount of daily data ({len(daily)}) should match with the number between start_date and end_date ({expected_days})."
                )
            for item in daily:
                if item["minimum_temperature"] > item["maximum_temperature"]:
                    raise serializers.ValidationError(
                        f"Minimum temperature {item['minimum_temperature']} exceeds maximum temperature {item['maximum_temperature']} on day {item['date']}."
                    )

            for item in daily:
                if not (start_date <= item["date"] <= end_date):
                    raise serializers.ValidationError(
                        f"date {item['date']} is out or range between {start_date} and {end_date}."
                    )

        elif freq == "monthly":
            for item in monthly:
                if item["minimum_temperature"] > item["maximum_temperature"]:
                    raise serializers.ValidationError(
                        f"Minimum temperature {item['minimum_temperature']} exceeds maximum temperature {item['maximum_temperature']} on month {item['month']}."
                    )

        method = data.get("calculation_method")
        # dates validation
        if data["end_date"] < data["start_date"]:
            raise serializers.ValidationError(
                "the end date cannot be before the start date"
            )

        # validation of variables acording to the calculation method

        required_fields_by_method = {
            "penman-monteith": [
                "maximum_temperature",
                "minimum_temperature",
                "relative_humidity",
                "wind_speed",
                "sunshine_hours",
                "altitude",
            ],
            "hargreaves": [
                "maximum_temperature",
                "minimum_temperature",
                "latitude",
                "start_date",
                "end_date",
            ],
            "turc": ["maximum_temperature", "minimum_temperature", "sunshine_hours"],
            "makkink": [
                "maximum_temperature",
                "minimum_temperature",
                "sunshine_hours",
                "altitude",
            ],
            "makkink-abstew": [
                "maximum_temperature",
                "minimum_temperature",
                "sunshine_hours",
                "altitude",
            ],
            "simple-abstew": ["sunshine_hours"],
            "priestley-taylor": [
                "maximum_temperature",
                "minimum_temperature",
                "sunshine_hours",
            ],
            "ivanov": [
                "maximum_temperature",
                "minimum_temperature",
                "relative_humidity",
            ],
            "christiansen": [
                "maximum_temperature",
                "minimum_temperature",
                "relative_humidity",
                "wind_speed",
                "sunshine_hours",
            ],
        }

        # valdate required fields for the selected method
        if method not in required_fields_by_method:
            raise serializers.ValidationError(f"Invalid calculation method: {method}")

        # verify required fields
        missing_fields = set()

        global_fields = ["altitude", "latitude", "start_date", "end_date"]

        for field in required_fields_by_method[method]:
            if field in global_fields:
                if data.get(field) is None:
                    missing_fields.add(field)
            else:
                if not all(
                    field in entry and entry[field] is not None
                    for entry in data.get("daily_data", [])
                ):
                    missing_fields.add(field)

        if missing_fields:
            raise serializers.ValidationError(
                f"Missing required fields for {method} method: {', '.join(missing_fields)}"
            )

        # validate start_date <= end_date
        if data["start_date"] > data["end_date"]:
            raise serializers.ValidationError("Start date cannot be after end date.")

        # validate end_date is not in the future
        if data["start_date"] > date.today():
            raise serializers.ValidationError("Start date cannot be in the future.")

        return data

    def calculate_eto(self, data):
        method = data["calculation_method"]
        frequency = data.get("data_frequency")

        print(f"Method: {method}, Frequency: {frequency}")

        if method == "penman-monteith":
            altitude = data["altitude"]

            if frequency == "daily":
                # data extraction
                daily_data = data["daily_data"]

                tmax_list = [d["maximum_temperature"] for d in daily_data]
                tmin_list = [d["minimum_temperature"] for d in daily_data]
                rh_list = [d["relative_humidity"] for d in daily_data]
                wind_list = [d["wind_speed"] for d in daily_data]
                sun_list = [d["sunshine_hours"] for d in daily_data]

                total_eto = 0
                for i in range(len(daily_data)):
                    t_mean = (tmax_list[i] + tmin_list[i]) / 2
                    p = 101.3 * ((293 - 0.0065 * altitude) / 293) ** 5.26
                    gamma = 0.000665 * p
                    es_tmax = 0.6108 * math.exp(
                        (17.27 * tmax_list[i]) / (tmax_list[i] + 237.3)
                    )
                    es_tmin = 0.6108 * math.exp(
                        (17.27 * tmin_list[i]) / (tmin_list[i] + 237.3)
                    )
                    es = (es_tmax + es_tmin) / 2.0
                    ea = es * (rh_list[i] / 100.0)
                    delta = (
                        4098 * (0.6108 * math.exp((17.27 * t_mean) / (t_mean + 237.3)))
                    ) / ((t_mean + 237.3) ** 2)
                    delta_es = es - ea
                    rn = sun_list[i]
                    g = 0
                    eto = (
                        (0.408 * delta * (rn - g))
                        + (gamma * (900 / (t_mean + 273)) * wind_list[i] * delta_es)
                    ) / (delta + gamma * (1 + 0.34 * wind_list[i]))
                    total_eto += eto

                return {
                    "reference_evapotranspiration": round(total_eto, 2),
                    "maximum_temperature_daily": tmax_list,
                    "minimum_temperature_daily": tmin_list,
                    "relative_humidity_daily": rh_list,
                    "wind_speed_daily": wind_list,
                    "sunshine_hours_daily": sun_list,
                    "average_max_temp": round(sum(tmax_list) / len(tmax_list), 2),
                    "average_min_temp": round(sum(tmin_list) / len(tmin_list), 2),
                    "average_relative_humidity": round(sum(rh_list) / len(rh_list), 2),
                    "average_wind_speed": round(sum(wind_list) / len(wind_list), 2),
                    "average_sunshine_hours": round(sum(sun_list) / len(sun_list), 2),
                }

            elif frequency == "monthly":
                monthly_data = data["monthly_data"]
                m = monthly_data[0]

                tmax = m["maximum_temperature"]
                tmin = m["minimum_temperature"]
                rh = m["relative_humidity"]
                wind = m["wind_speed"]
                sun = m["sunshine_hours"]

                t_mean = (tmax + tmin) / 2
                p = 101.3 * ((293 - 0.0065 * altitude) / 293) ** 5.26
                gamma = 0.000665 * p
                es_tmax = 0.6108 * math.exp((17.27 * tmax) / (tmax + 237.3))
                es_tmin = 0.6108 * math.exp((17.27 * tmin) / (tmin + 237.3))
                es = (es_tmax + es_tmin) / 2.0
                ea = es * (rh / 100.0)
                delta = (
                    4098 * (0.6108 * math.exp((17.27 * t_mean) / (t_mean + 237.3)))
                ) / ((t_mean + 237.3) ** 2)
                delta_es = es - ea
                rn = sun
                g = 0
                eto = (
                    (0.408 * delta * (rn - g))
                    + (gamma * (900 / (t_mean + 273)) * wind * delta_es)
                ) / (delta + gamma * (1 + 0.34 * wind))

                return {
                    "reference_evapotranspiration": round(eto, 2),
                    "maximum_temperature_daily": [],
                    "minimum_temperature_daily": [],
                    "relative_humidity_daily": [],
                    "wind_speed_daily": [],
                    "sunshine_hours_daily": [],
                    "average_max_temp": round(tmax, 2),
                    "average_min_temp": round(tmin, 2),
                    "average_relative_humidity": round(rh, 2),
                    "average_wind_speed": round(wind, 2),
                    "average_sunshine_hours": round(sun, 2),
                }

        elif method == "hargreaves":
            # Implement the Hargreaves calculation logic here
            raise NotImplementedError("Hargreaves method not implemented yet.")
        elif method == "turc":
            # Implement the Turc calculation logic here
            raise NotImplementedError("Hargreaves method not implemented yet.")
        elif method == "makkink":
            # Implement the Makkink calculation logic here
            raise NotImplementedError("Hargreaves method not implemented yet.")
        elif method == "makkink-abstew":
            # Implement the Makkink-Abstew calculation logic here
            raise NotImplementedError("Hargreaves method not implemented yet.")
        elif method == "simple-abstew":
            # Implement the Simple Abstew calculation logic here
            raise NotImplementedError("Hargreaves method not implemented yet.")
        elif method == "priestley-taylor":
            # Implement the Priestley-Taylor calculation logic here
            raise NotImplementedError("Hargreaves method not implemented yet.")
        elif method == "ivanov":
            # Implement the Ivanov calculation logic here
            raise NotImplementedError("Hargreaves method not implemented yet.")
        elif method == "christiansen":
            # Implement the Christiansen calculation logic here
            raise NotImplementedError("Hargreaves method not implemented yet.")
        else:
            raise serializers.ValidationError(
                f"Calculation method '{method}' is not yet implemented or supported for frequency '{frequency}'."
            )

    def create(self, validated_data):
        # Llama a la función calculate_eto que ya debe procesar daily_data
        daily_data = validated_data.get("daily_data")
        monthly_data = validated_data.get("monthly_data")
        data_frequency = validated_data.get("data_frequency")

        result = self.calculate_eto(
            {
                **validated_data,
                "daily_data": daily_data,
                "monthly_data": monthly_data,
                "data_frequency": data_frequency,
            }
        )

        if not result or not isinstance(result, dict):
            raise serializers.ValidationError(
                "The calculation did not return valid data."
            )

        # Añadir al diccionario validado todos los datos procesados
        validated_data["reference_evapotranspiration"] = result[
            "reference_evapotranspiration"
        ]
        validated_data["maximum_temperature_daily"] = result[
            "maximum_temperature_daily"
        ]
        validated_data["minimum_temperature_daily"] = result[
            "minimum_temperature_daily"
        ]
        validated_data["relative_humidity_daily"] = result["relative_humidity_daily"]
        validated_data["wind_speed_daily"] = result["wind_speed_daily"]
        validated_data["sunshine_hours_daily"] = result["sunshine_hours_daily"]
        validated_data["average_max_temp"] = result["average_max_temp"]
        validated_data["average_min_temp"] = result["average_min_temp"]
        validated_data["average_relative_humidity"] = result[
            "average_relative_humidity"
        ]
        validated_data["average_wind_speed"] = result["average_wind_speed"]
        validated_data["average_sunshine_hours"] = result["average_sunshine_hours"]

        validated_data.pop("daily_data", None)
        validated_data.pop("monthly_data", None)
        validated_data.pop("data_frequency", None)

        validated_data.update(result)
        return super().create(validated_data)


class NasaPowerRequestSerializer(serializers.Serializer):
    latitud = serializers.FloatField(
        min_value=-90.0,
        max_value=90.0,
        help_text="Latitude of the location (between -90 and 90 degrees in decimal format)",
    )
    longitud = serializers.FloatField(
        min_value=-180.0,
        max_value=180.0,
        help_text="Latitude of the location (between -90 and 90 degrees in decimal format)",
    )
    start_date = serializers.DateField(
        help_text="Start date for the data request (format: YYYY-MM-DD)"
    )
    end_date = serializers.DateField(
        help_text="End date for the data request (format: YYYY-MM-DD)"
    )

    def validate(self, data):
        if data["start_date"] > data["end_date"]:
            raise serializers.ValidationError("Start date cannot be after end date.")

        if data["end_date"] > date.today():
            raise serializers.ValidationError("End date cannot be in the future.")

        max_days = 30
        if (data["end_date"] - data["start_date"]).days > max_days:
            raise serializers.ValidationError(
                f"The date range cannot exceed {max_days} days."
            )

        return data
