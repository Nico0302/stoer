$(document).ready(function () {
  createTimeChart();
  createDayChart();
  fetchData();
});

let timeChart,
  dayChart,
  rawData = null;

let dataCleanUp = false;

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
const startDate = new Date("2020-12-01").getTime();
const endDate = new Date().getTime();

function toggleCleanUp() {
  const checkBox = document.getElementById("cleanup");
  dataCleanUp = checkBox.checked;
  updateCharts();
}

function updateCharts() {
  let data = rawData;

  if (dataCleanUp) {
    let lastDate = null;
    data = data.filter((row) => {
      const result =
        !lastDate || Math.abs(moment(row).diff(lastDate, "minutes")) > 30;
      if (result) {
        lastDate = row;
      }
      return result;
    });
  }
  updateTimeChart(data);
  updateDayChart(data);
}

function fetchData() {
  $.ajax({
    type: "GET",
    url: "https://online-graph.hosting145113.a2e91.netcup.net/data.csv",
    dataType: "text",
    success: function (data) {
      rawData = data
        .split("\n")
        .slice(0, -1)
        .map((row) => row.split(",")[0]);

      updateCharts();
    },
  });
}

function createTimeChart() {
  var options = {
    series: [],
    colors: ["#e60000"],
    chart: {
      type: "scatter",
      height: 700,
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
    annotations: {
      xaxis: ["2021-03-31", "2021-03-23", "2020-12-30"].map((date) => ({
        x: new Date(date).getTime(),
        borderColor: "#00E396",
        label: {
          borderColor: "#00E396",
          style: {
            color: "#fff",
            background: "#00E396",
          },
          text: "Techniker",
        },
      })),
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
          const hours = Math.floor(value / 60);
          const minutes = value % 60;
          return `${hours}:${minutes}${minutes % 10 === 0 ? "0" : ""}`;
        },
      },
    },
  };

  timeChart = new ApexCharts(document.querySelector("#chart"), options);

  timeChart.render();
}

function updateTimeChart(csvData) {
  let data = csvData.map((row) => {
    const timestamp = row.split("T");
    const time = timestamp[1].split(/:/g);
    return [timestamp[0], parseInt(time[0]) * 60 + parseInt(time[1])];
  });

  timeChart.updateSeries([
    {
      name: "Ausfall",
      data: data,
    },
  ]);
}

function createDayChart() {
  var options = {
    series: [],
    chart: {
      type: "heatmap",
      height: 300,
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
          const date =
            chartContext.series[config.seriesIndex].data[config.dataPointIndex]
              .x;
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

function updateDayChart(csvData) {
  let dates = {};

  csvData.forEach((row) => {
    const date = row.split("T")[0];
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

  dayChart.updateSeries(series);
}
