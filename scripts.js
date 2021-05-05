$(document).ready(function () {
  $.ajax({
    type: "GET",
    url: "https://online-graph.hosting145113.a2e91.netcup.net/data.csv",
    dataType: "text",
    success: function (data) {
      const csvData = data.split("\n").slice(0, -1);
      drawTimeChart(csvData);
      drawDayChart(csvData);
    },
  });
});

let timeChart,
  dayChart = null;

const shortDays = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const shortMonths = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];
const locales = [
  {
    name: "de",
    options: {
      shortMonths: shortMonths,
      shortDays: shortDays,
    },
  },
];
const startDate = new Date("2020-07-01").getTime();
const endDate = new Date().getTime();

function drawTimeChart(csvData) {
  let data = csvData.map((row) => {
    const timestamp = row.split(",")[0].split("T");
    const time = timestamp[1].split(/:/g);
    return [timestamp[0], parseInt(time[0]) * 60 + parseInt(time[1])];
  });

  var options = {
    series: [
      {
        name: "Ausfall",
        data: data,
      },
    ],
    colors: ["#e60000"],
    chart: {
      type: "scatter",
      height: 600,
      zoom: {
        type: "x",
      },
      animations: {
        enabled: false,
      },
      locales,
      defaultLocale: "de",
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    xaxis: {
      type: "datetime",
      max: endDate,
      min: startDate,
    },
    yaxis: {
      min: 0,
      max: 24 * 60,
      tickAmount: 24,
      labels: {
        formatter: function (value) {
          const hours = Math.round(value / 60);
          const minutes = value % 60;
          return `${hours}:${minutes}${minutes % 10 === 0 ? 0 : ""}`;
        },
      },
    },
  };

  timeChart = new ApexCharts(document.querySelector("#chart"), options);

  timeChart.render();
}

function drawDayChart(csvData) {
  let dates = {};

  csvData.forEach((row) => {
    const date = row.split(",")[0].split("T")[0];
    if (dates[date]) {
      dates[date] += 1;
    } else {
      dates[date] = 1;
    }
  });

  const series = ["So", "Sa", "Fr", "Do", "Mi", "Di", "Mo"].map(
    (name, index) => {
      const isoWeekday = 6 - index + 1;
      let data = [];
      let date = moment(startDate).isoWeekday(isoWeekday);

      while (date.isBefore(endDate)) {
        const dateKey = date.format("YYYY-MM-DD");
        data.push({
          x: dateKey,
          y: dates[dateKey] || 0,
        });
        date.add(7, "days");
      }

      return {
        name,
        data,
      };
    }
  );

  var options = {
    series: series,
    chart: {
      type: "heatmap",
      height: 400,
      zoom: {
        enabled: false,
      },
      animations: {
        enabled: false,
      },
      locales,
      defaultLocale: "de",
      events: {
        dataPointSelection: function (event, chartContext, config) {
          const date = series[config.seriesIndex].data[config.dataPointIndex].x;
          timeChart.zoomX(
            moment(date).subtract(14, "days").valueOf(),
            moment(date).add(14, "days").valueOf()
          );
        },
      },
    },
    plotOptions: {
      heatmap: {
        colorScale: {
          ranges: [
            {
              from: -2,
              to: 1,
              color: "#80d080",
              name: "stabil",
            },
            {
              from: 2,
              to: 5,
              color: "#FFB200",
              name: "gestört",
            },
            {
              from: 6,
              to: 16,
              color: "#d20724",
              name: "stark gestört",
            },
          ],
        },
      },
    },
    xaxis: {
      type: "datetime",
      max: endDate,
      min: startDate,
      labels: {
        datetimeFormatter: {
          year: "yyyy",
          month: "MMM 'yy",
          day: "MMM",
          hour: "HH:mm",
        },
      },
    },
  };

  dayChart = new ApexCharts(document.querySelector("#weekChart"), options);

  dayChart.render();
}
