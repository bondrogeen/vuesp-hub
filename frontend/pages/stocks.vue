<template>
  <div>
    <VBreadcrumb :items="[{ name: 'Home', path: '/' }, { name: 'Video' }]" />

    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12">
        <!-- Metric Group Five -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
          <!-- Metric Item Start -->
          <div class="rounded-2xl border border-gray-200 bg-white px-6 pb-5 pt-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="mb-6 flex items-center gap-3">
              <div class="h-10 w-10">
                <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg" alt="brand" />
              </div>

              <div>
                <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">AAPL</h3>
                <span class="block text-theme-xs text-gray-500 dark:text-gray-400">Apple, Inc</span>
              </div>
            </div>

            <div class="flex items-end justify-between">
              <div>
                <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">$1,232.00</h4>
              </div>

              <span class="flex items-center gap-1 rounded-full bg-success-50 py-0.5 pl-2 pr-2.5 text-sm font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
                <svg class="fill-current" width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M6.06462 1.62393C6.20193 1.47072 6.40135 1.37432 6.62329 1.37432C6.6236 1.37432 6.62391 1.37432 6.62422 1.37432C6.81631 1.37415 7.00845 1.44731 7.15505 1.5938L10.1551 4.5918C10.4481 4.88459 10.4483 5.35946 10.1555 5.65246C9.86273 5.94546 9.38785 5.94562 9.09486 5.65283L7.37329 3.93247L7.37329 10.125C7.37329 10.5392 7.03751 10.875 6.62329 10.875C6.20908 10.875 5.87329 10.5392 5.87329 10.125L5.87329 3.93578L4.15516 5.65281C3.86218 5.94561 3.3873 5.94546 3.0945 5.65248C2.8017 5.35949 2.80185 4.88462 3.09484 4.59182L6.06462 1.62393Z"
                    fill=""
                  ></path>
                </svg>

                11.01%
              </span>
            </div>
          </div>
          <!-- Metric Item End -->

          <!-- Metric Item Start -->
          <div class="rounded-2xl border border-gray-200 bg-white px-6 pb-5 pt-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="mb-6 flex items-center gap-3">
              <div class="h-10 w-10">
                <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg" alt="brand" />
              </div>

              <div>
                <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">PYPL</h3>
                <span class="block text-theme-xs text-gray-500 dark:text-gray-400">Paypal, Inc</span>
              </div>
            </div>

            <div class="flex items-end justify-between">
              <div>
                <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">$965.00</h4>
              </div>

              <span class="flex items-center gap-1 rounded-full bg-error-50 py-0.5 pl-2 pr-2.5 text-sm font-medium text-error-600 dark:bg-error-500/15 dark:text-error-500">
                <svg class="fill-current" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M5.31462 10.3761C5.45194 10.5293 5.65136 10.6257 5.87329 10.6257C5.8736 10.6257 5.8739 10.6257 5.87421 10.6257C6.0663 10.6259 6.25845 10.5527 6.40505 10.4062L9.40514 7.4082C9.69814 7.11541 9.69831 6.64054 9.40552 6.34754C9.11273 6.05454 8.63785 6.05438 8.34486 6.34717L6.62329 8.06753L6.62329 1.875C6.62329 1.46079 6.28751 1.125 5.87329 1.125C5.45908 1.125 5.12329 1.46079 5.12329 1.875L5.12329 8.06422L3.40516 6.34719C3.11218 6.05439 2.6373 6.05454 2.3445 6.34752C2.0517 6.64051 2.05185 7.11538 2.34484 7.40818L5.31462 10.3761Z"
                    fill=""
                  ></path>
                </svg>

                9.05%
              </span>
            </div>
          </div>
          <!-- Metric Item End -->

          <!-- Metric Item Start -->
          <div class="rounded-2xl border border-gray-200 bg-white px-6 pb-5 pt-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="mb-6 flex items-center gap-3">
              <div class="h-10 w-10">
                <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg/images/brand/brand-09.svg" alt="brand" />
              </div>

              <div>
                <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">TSLA</h3>
                <span class="block text-theme-xs text-gray-500 dark:text-gray-400">Tesla, Inc</span>
              </div>
            </div>

            <div class="flex items-end justify-between">
              <div>
                <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">$1,232.00</h4>
              </div>

              <span class="flex items-center gap-1 rounded-full bg-success-50 py-0.5 pl-2 pr-2.5 text-sm font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
                <svg class="fill-current" width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M6.06462 1.62393C6.20193 1.47072 6.40135 1.37432 6.62329 1.37432C6.6236 1.37432 6.62391 1.37432 6.62422 1.37432C6.81631 1.37415 7.00845 1.44731 7.15505 1.5938L10.1551 4.5918C10.4481 4.88459 10.4483 5.35946 10.1555 5.65246C9.86273 5.94546 9.38785 5.94562 9.09486 5.65283L7.37329 3.93247L7.37329 10.125C7.37329 10.5392 7.03751 10.875 6.62329 10.875C6.20908 10.875 5.87329 10.5392 5.87329 10.125L5.87329 3.93578L4.15516 5.65281C3.86218 5.94561 3.3873 5.94546 3.0945 5.65248C2.8017 5.35949 2.80185 4.88462 3.09484 4.59182L6.06462 1.62393Z"
                    fill=""
                  ></path>
                </svg>

                11.01%
              </span>
            </div>
          </div>
          <!-- Metric Item End -->

          <!-- Metric Item Start -->
          <div class="rounded-2xl border border-gray-200 bg-white px-6 pb-5 pt-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="mb-6 flex items-center gap-3">
              <div class="h-10 w-10">
                <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg" alt="brand" />
              </div>

              <div>
                <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">AMZN</h3>
                <span class="block text-theme-xs text-gray-500 dark:text-gray-400">Amazone.com, Inc</span>
              </div>
            </div>

            <div class="flex items-end justify-between">
              <div>
                <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">$2,567.99</h4>
              </div>

              <span class="flex items-center gap-1 rounded-full bg-success-50 py-0.5 pl-2 pr-2.5 text-sm font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
                <svg class="fill-current" width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M6.06462 1.62393C6.20193 1.47072 6.40135 1.37432 6.62329 1.37432C6.6236 1.37432 6.62391 1.37432 6.62422 1.37432C6.81631 1.37415 7.00845 1.44731 7.15505 1.5938L10.1551 4.5918C10.4481 4.88459 10.4483 5.35946 10.1555 5.65246C9.86273 5.94546 9.38785 5.94562 9.09486 5.65283L7.37329 3.93247L7.37329 10.125C7.37329 10.5392 7.03751 10.875 6.62329 10.875C6.20908 10.875 5.87329 10.5392 5.87329 10.125L5.87329 3.93578L4.15516 5.65281C3.86218 5.94561 3.3873 5.94546 3.0945 5.65248C2.8017 5.35949 2.80185 4.88462 3.09484 4.59182L6.06462 1.62393Z"
                    fill=""
                  ></path>
                </svg>

                11.01%
              </span>
            </div>
          </div>
          <!-- Metric Item End -->
        </div>
        <!-- Metric Group Five -->
      </div>

      <div class="col-span-12 space-y-6 xl:col-span-8">
        <!-- ====== Chart Fourteen Start -->
        <div class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-5">
          <div class="flex flex-col gap-5 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Portfolio Performance</h3>
              <p class="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">Here is your performance stats of each month</p>
            </div>

            <div x-data="{selected: 'optionOne'}" class="inline-flex w-fit items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
              <button
                @click="selected = 'optionOne'"
                :class="selected === 'optionOne' ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400'"
                class="px-3 py-2 font-medium transition-colors rounded-md text-theme-sm hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
              >
                Monthly
              </button>

              <button
                @click="selected = 'optionTwo'"
                :class="selected === 'optionTwo' ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400'"
                class="px-3 py-2 font-medium transition-colors rounded-md text-theme-sm hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white text-gray-500 dark:text-gray-400"
              >
                Quarterly
              </button>

              <button
                @click="selected = 'optionThree'"
                :class="selected === 'optionThree' ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400'"
                class="px-3 py-2 font-medium transition-colors rounded-md text-theme-sm hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white text-gray-500 dark:text-gray-400"
              >
                Annually
              </button>
            </div>
          </div>
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <div id="chartFourteen" class="-ml-4 min-w-[900px] pl-2 xl:min-w-full" style="min-height: 350px">
              <div id="apexchartsarea-datetime" class="apexcharts-canvas apexchartsarea-datetime apexcharts-theme-" style="width: 581px; height: 335px">
                <svg
                  id="SvgjsSvg1599"
                  width="581"
                  height="335"
                  xmlns="http://www.w3.org/2000/svg"
                  version="1.1"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  xmlns:svgjs="http://svgjs.dev"
                  class="apexcharts-svg apexcharts-zoomable"
                  xmlns:data="ApexChartsNS"
                  transform="translate(0, 0)"
                >
                  <foreignObject x="0" y="0" width="581" height="335">
                    <div xmlns="http://www.w3.org/1999/xhtml" style="position: relative; height: 100%; width: 100%">
                      <div class="apexcharts-legend" style="max-height: 167.5px"></div>
                    </div>
                  </foreignObject>
                  <rect id="SvgjsRect1607" width="0" height="0" x="0" y="0" rx="0" ry="0" opacity="1" stroke-width="0" stroke="none" stroke-dasharray="0" fill="#fefefe"></rect>
                  <g id="SvgjsG1625" class="apexcharts-datalabels-group" transform="translate(0, 0) scale(1)"></g>
                  <g id="SvgjsG1626" class="apexcharts-datalabels-group" transform="translate(0, 0) scale(1)"></g>
                  <g id="SvgjsG1678" class="apexcharts-yaxis" rel="0" transform="translate(29.605819702148438, 0)">
                    <g id="SvgjsG1679" class="apexcharts-yaxis-texts-g">
                      <text
                        id="SvgjsText1681"
                        font-family="Outfit, sans-serif"
                        x="20"
                        y="33.666666666666664"
                        text-anchor="end"
                        dominant-baseline="auto"
                        font-size="11px"
                        font-weight="400"
                        fill="#373d3f"
                        class="apexcharts-text apexcharts-yaxis-label"
                        style="font-family: Outfit, sans-serif"
                      >
                        <tspan id="SvgjsTspan1682">40.00</tspan>
                        <title>40.00</title>
                      </text>
                      <text
                        id="SvgjsText1684"
                        font-family="Outfit, sans-serif"
                        x="20"
                        y="79"
                        text-anchor="end"
                        dominant-baseline="auto"
                        font-size="11px"
                        font-weight="400"
                        fill="#373d3f"
                        class="apexcharts-text apexcharts-yaxis-label"
                        style="font-family: Outfit, sans-serif"
                      >
                        <tspan id="SvgjsTspan1685">38.00</tspan>
                        <title>38.00</title>
                      </text>
                      <text
                        id="SvgjsText1687"
                        font-family="Outfit, sans-serif"
                        x="20"
                        y="124.33333333333334"
                        text-anchor="end"
                        dominant-baseline="auto"
                        font-size="11px"
                        font-weight="400"
                        fill="#373d3f"
                        class="apexcharts-text apexcharts-yaxis-label"
                        style="font-family: Outfit, sans-serif"
                      >
                        <tspan id="SvgjsTspan1688">36.00</tspan>
                        <title>36.00</title>
                      </text>
                      <text
                        id="SvgjsText1690"
                        font-family="Outfit, sans-serif"
                        x="20"
                        y="169.66666666666669"
                        text-anchor="end"
                        dominant-baseline="auto"
                        font-size="11px"
                        font-weight="400"
                        fill="#373d3f"
                        class="apexcharts-text apexcharts-yaxis-label"
                        style="font-family: Outfit, sans-serif"
                      >
                        <tspan id="SvgjsTspan1691">34.00</tspan>
                        <title>34.00</title>
                      </text>
                      <text
                        id="SvgjsText1693"
                        font-family="Outfit, sans-serif"
                        x="20"
                        y="215.00000000000003"
                        text-anchor="end"
                        dominant-baseline="auto"
                        font-size="11px"
                        font-weight="400"
                        fill="#373d3f"
                        class="apexcharts-text apexcharts-yaxis-label"
                        style="font-family: Outfit, sans-serif"
                      >
                        <tspan id="SvgjsTspan1694">32.00</tspan>
                        <title>32.00</title>
                      </text>
                      <text
                        id="SvgjsText1696"
                        font-family="Outfit, sans-serif"
                        x="20"
                        y="260.33333333333337"
                        text-anchor="end"
                        dominant-baseline="auto"
                        font-size="11px"
                        font-weight="400"
                        fill="#373d3f"
                        class="apexcharts-text apexcharts-yaxis-label"
                        style="font-family: Outfit, sans-serif"
                      >
                        <tspan id="SvgjsTspan1697">30.00</tspan>
                        <title>30.00</title>
                      </text>
                      <text
                        id="SvgjsText1699"
                        font-family="Outfit, sans-serif"
                        x="20"
                        y="305.6666666666667"
                        text-anchor="end"
                        dominant-baseline="auto"
                        font-size="11px"
                        font-weight="400"
                        fill="#373d3f"
                        class="apexcharts-text apexcharts-yaxis-label"
                        style="font-family: Outfit, sans-serif"
                      >
                        <tspan id="SvgjsTspan1700">28.00</tspan>
                        <title>28.00</title>
                      </text>
                    </g>
                  </g>
                  <g id="SvgjsG1601" class="apexcharts-inner apexcharts-graphical" transform="translate(59.60581970214844, 30)">
                    <defs id="SvgjsDefs1600">
                      <clipPath id="gridRectMaskmfwh6jti">
                        <rect id="SvgjsRect1622" width="511.39418029785156" height="272" x="0" y="0" rx="0" ry="0" opacity="1" stroke-width="0" stroke="none" stroke-dasharray="0" fill="#fff"></rect>
                      </clipPath>
                      <clipPath id="gridRectBarMaskmfwh6jti">
                        <rect
                          id="SvgjsRect1623"
                          width="516.3941802978516"
                          height="277"
                          x="-2.5"
                          y="-2.5"
                          rx="0"
                          ry="0"
                          opacity="1"
                          stroke-width="0"
                          stroke="none"
                          stroke-dasharray="0"
                          fill="#fff"
                        ></rect>
                      </clipPath>
                      <clipPath id="gridRectMarkerMaskmfwh6jti">
                        <rect id="SvgjsRect1624" width="511.39418029785156" height="272" x="0" y="0" rx="0" ry="0" opacity="1" stroke-width="0" stroke="none" stroke-dasharray="0" fill="#fff"></rect>
                      </clipPath>
                      <clipPath id="forecastMaskmfwh6jti"></clipPath>
                      <clipPath id="nonForecastMaskmfwh6jti"></clipPath>
                      <linearGradient id="SvgjsLinearGradient1631" x1="0" y1="0" x2="0" y2="1">
                        <stop id="SvgjsStop1632" stop-opacity="0.55" stop-color="rgba(70,95,255,0.55)" offset="0"></stop>
                        <stop id="SvgjsStop1633" stop-opacity="0" stop-color="rgba(163,175,255,0)" offset="1"></stop>
                        <stop id="SvgjsStop1634" stop-opacity="0" stop-color="rgba(163,175,255,0)" offset="1"></stop>
                      </linearGradient>
                    </defs>
                    <line
                      id="SvgjsLine1608"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="234.133544921875"
                      stroke="#b6b6b6"
                      stroke-dasharray="3"
                      stroke-linecap="butt"
                      class="apexcharts-xcrosshairs"
                      x="0"
                      y="0"
                      width="1"
                      height="234.133544921875"
                      fill="#b1b9c4"
                      filter="none"
                      fill-opacity="0.9"
                      stroke-width="1"
                    ></line>
                    <g id="SvgjsG1637" class="apexcharts-grid">
                      <g id="SvgjsG1638" class="apexcharts-gridlines-horizontal">
                        <line
                          id="SvgjsLine1642"
                          x1="0"
                          y1="45.333333333333336"
                          x2="511.39418029785156"
                          y2="45.333333333333336"
                          stroke="#e0e0e0"
                          stroke-dasharray="0"
                          stroke-linecap="butt"
                          class="apexcharts-gridline"
                        ></line>
                        <line
                          id="SvgjsLine1643"
                          x1="0"
                          y1="90.66666666666667"
                          x2="511.39418029785156"
                          y2="90.66666666666667"
                          stroke="#e0e0e0"
                          stroke-dasharray="0"
                          stroke-linecap="butt"
                          class="apexcharts-gridline"
                        ></line>
                        <line id="SvgjsLine1644" x1="0" y1="136" x2="511.39418029785156" y2="136" stroke="#e0e0e0" stroke-dasharray="0" stroke-linecap="butt" class="apexcharts-gridline"></line>
                        <line
                          id="SvgjsLine1645"
                          x1="0"
                          y1="181.33333333333334"
                          x2="511.39418029785156"
                          y2="181.33333333333334"
                          stroke="#e0e0e0"
                          stroke-dasharray="0"
                          stroke-linecap="butt"
                          class="apexcharts-gridline"
                        ></line>
                        <line
                          id="SvgjsLine1646"
                          x1="0"
                          y1="226.66666666666669"
                          x2="511.39418029785156"
                          y2="226.66666666666669"
                          stroke="#e0e0e0"
                          stroke-dasharray="0"
                          stroke-linecap="butt"
                          class="apexcharts-gridline"
                        ></line>
                      </g>
                      <g id="SvgjsG1639" class="apexcharts-gridlines-vertical"></g>
                      <line id="SvgjsLine1649" x1="0" y1="272" x2="511.39418029785156" y2="272" stroke="transparent" stroke-dasharray="0" stroke-linecap="butt"></line>
                      <line id="SvgjsLine1648" x1="0" y1="1" x2="0" y2="272" stroke="transparent" stroke-dasharray="0" stroke-linecap="butt"></line>
                    </g>
                    <g id="SvgjsG1640" class="apexcharts-grid-borders">
                      <line id="SvgjsLine1641" x1="0" y1="0" x2="511.39418029785156" y2="0" stroke="#e0e0e0" stroke-dasharray="0" stroke-linecap="butt" class="apexcharts-gridline"></line>
                      <line id="SvgjsLine1647" x1="0" y1="272" x2="511.39418029785156" y2="272" stroke="#e0e0e0" stroke-dasharray="0" stroke-linecap="butt" class="apexcharts-gridline"></line>
                    </g>
                    <g id="SvgjsG1627" class="apexcharts-area-series apexcharts-plot-series">
                      <g id="SvgjsG1628" class="apexcharts-series" zIndex="0" seriesName="PortfolioxPerformance" data:longestSeries="true" rel="1" data:realIndex="0">
                        <path
                          id="SvgjsPath1635"
                          d="M 0 205.13333333333333 L 1.5449975235584639 196.2933333333333 L 3.0899950471169277 199.91999999999996 L 4.634992570675392 202.86666666666667 L 9.269985141350784 204 L 10.814982664909248 205.13333333333333 L 12.359980188467711 198.56000000000006 L 13.904977712026175 197.42666666666673 L 15.44997523558464 184.73333333333335 L 20.084967806260032 184.50666666666666 L 21.629965329818496 174.98666666666668 L 23.17496285337696 179.0666666666666 L 24.719960376935422 166.60000000000002 L 26.264957900493886 176.57333333333327 L 30.89995047116928 173.39999999999998 L 32.44494799472774 171.36 L 33.989945518286206 170.90666666666664 L 35.53494304184467 161.84000000000003 L 37.079940565403135 164.33333333333337 L 43.25993065963699 169.09333333333336 L 44.80492818319546 173.85333333333335 L 46.34992570675392 159.3466666666667 L 47.89492323031238 149.37333333333345 L 52.52991580098777 152.54666666666662 L 54.07491332454624 152.54666666666662 L 55.6199108481047 161.15999999999997 L 57.16490837166317 156.39999999999998 L 58.70990589522163 142.12000000000012 L 63.344898465897025 153.68000000000006 L 64.88989598945548 181.56000000000006 L 66.43489351301395 172.04000000000008 L 67.97989103657241 157.53333333333342 L 69.52488856013088 144.15999999999997 L 74.15988113080627 145.97333333333324 L 75.70487865436473 131.01333333333332 L 77.2498761779232 141.21333333333325 L 78.79487370148166 132.14666666666665 L 80.33987122504013 140.08000000000004 L 84.97486379571552 124.44000000000005 L 86.51986131927399 155.04000000000008 L 88.06485884283245 145.97333333333324 L 89.60985636639091 142.57333333333338 L 91.15485388994938 140.30666666666662 L 95.72547156380983 126.9333333333334 L 97.2704690873683 121.71999999999991 L 98.81546661092676 125.57333333333338 L 100.36046413448523 125.12000000000012 L 101.90546165804369 128.97333333333324 L 106.54045422871907 120.13333333333333 L 108.08545175227754 128.97333333333324 L 109.630449275836 148.24 L 111.17544679939446 145.2933333333333 L 117.35543689362832 153.68000000000006 L 118.90043441718679 167.50666666666666 L 120.44543194074525 158.44000000000005 L 121.99042946430372 146.20000000000005 L 123.53542698786218 154.5866666666667 L 128.17041955853756 162.2933333333333 L 129.71541708209602 139.62666666666655 L 131.2604146056545 149.8266666666667 L 132.80541212921295 160.7066666666667 L 134.35040965277142 157.30666666666662 L 138.9854022234468 167.2800000000001 L 140.53039974700528 172.26666666666677 L 142.07539727056374 155.7199999999999 L 143.6203947941222 152.77333333333343 L 145.16539231768067 145.5200000000001 L 149.80038488835606 146.20000000000005 L 151.34538241191453 141.21333333333325 L 152.890379935473 141.44000000000005 L 154.43537745903146 151.4133333333333 L 155.98037498258992 167.50666666666666 L 160.61536755326532 169.54666666666662 L 162.16036507682378 166.14666666666665 L 163.70536260038224 169.54666666666662 L 165.2503601239407 183.14666666666665 L 166.79535764749917 176.79999999999995 L 171.43035021817457 176.12000000000012 L 172.97534774173303 173.85333333333335 L 174.5203452652915 173.1733333333334 L 176.06534278884996 181.10666666666668 L 177.61034031240843 196.97333333333336 L 182.24533288308382 181.10666666666668 L 183.79033040664228 181.10666666666668 L 185.33532793020075 177.25333333333333 L 186.8803254537592 191.76 L 188.42532297731768 190.39999999999998 L 194.60531307155154 180.20000000000005 L 196.15031059511 197.42666666666673 L 197.69530811866846 202.86666666666667 L 199.24030564222693 230.74666666666667 L 203.8752982129023 219.64 L 205.42029573646076 210.80000000000007 L 206.96529326001922 188.36 L 208.5102907835777 196.74666666666667 L 210.05528830713615 189.26666666666665 L 214.69028087781155 201.0533333333334 L 216.23527840137 186.54666666666674 L 217.78027592492847 186.09333333333336 L 219.32527344848694 188.81333333333328 L 220.8702709720454 172.49333333333334 L 225.5052635427208 167.05333333333328 L 227.05026106627926 161.15999999999997 L 228.59525858983773 181.56000000000006 L 230.1402561133962 198.78666666666663 L 231.68525363695466 191.08000000000004 L 236.32024620763005 207.62666666666667 L 237.8652437311885 202.4133333333333 L 239.41024125474698 194.7066666666667 L 240.95523877830544 200.14666666666665 L 242.5002363018639 172.94666666666672 L 247.1352288725393 177.02666666666676 L 248.68022639609777 169.77333333333343 L 251.7702214432147 169.31999999999994 L 253.31521896677316 195.61333333333334 L 257.9502115374485 216.91999999999996 L 259.495209061007 216.69333333333327 L 261.04020658456545 222.13333333333333 L 262.58520410812395 223.49333333333334 L 264.1302016316824 211.9333333333334 L 268.7651942023578 217.60000000000002 L 270.31019172591624 211.9333333333334 L 271.85518924947473 194.25333333333333 L 273.40018677303317 183.8266666666667 L 274.94518429659166 195.38666666666666 L 279.580176867267 212.15999999999997 L 281.1251743908255 226.21333333333337 L 282.67017191438396 219.18666666666672 L 284.21516943794245 205.13333333333333 L 285.7601669615009 183.8266666666667 L 290.3951595321763 203.7733333333333 L 291.94015705573474 206.72000000000003 L 293.48515457929324 211.02666666666664 L 295.0301521028517 213.5200000000001 L 296.57514962641017 180.87999999999988 L 301.21014219708553 178.15999999999997 L 302.755139720644 172.94666666666672 L 304.30013724420246 169.77333333333343 L 305.84513476776095 166.60000000000002 L 307.3901322913194 166.8266666666667 L 312.0251248619948 175.21333333333325 L 313.57012238555325 179.0666666666666 L 315.1151199091117 160.7066666666667 L 316.6601174326702 143.9333333333334 L 318.2051149562286 140.53333333333342 L 322.84010752690403 137.81333333333328 L 324.38510505046247 141.66666666666663 L 325.93010257402096 139.62666666666655 L 327.4751000975794 147.33333333333337 L 329.0200976211379 175.44000000000005 L 333.65509019181326 174.08000000000004 L 335.20008771537175 179.97333333333324 L 336.7450852389302 182.24 L 338.2900827624887 193.57333333333327 L 339.8350802860471 197.88 L 346.015070380281 194.25333333333333 L 347.56006790383947 175.44000000000005 L 349.1050654273979 163.42666666666673 L 350.6500629509564 170.90666666666664 L 355.28505552163176 178.38666666666666 L 356.83005304519025 171.5866666666667 L 358.3750505687487 171.81333333333328 L 359.9200480923072 162.97333333333324 L 361.4650456158656 150.95999999999992 L 366.10003818654104 149.37333333333345 L 367.6450357100995 168.4133333333333 L 369.19003323365797 155.94666666666672 L 370.7350307572164 123.98666666666668 L 372.2800282807749 139.85333333333335 L 376.91502085145027 149.37333333333345 L 378.46001837500876 160.9333333333334 L 380.0050158985672 169.31999999999994 L 381.5500134221257 163.20000000000005 L 383.0950109456841 171.36 L 387.73000351635955 167.2800000000001 L 389.275001039918 168.4133333333333 L 390.8199985634764 167.73333333333335 L 392.3649960870349 165.92000000000007 L 393.90999361059335 170.68000000000006 L 398.54498618126877 176.12000000000012 L 400.0899837048272 188.5866666666667 L 401.6349812283857 192.43999999999994 L 403.17997875194413 186.31999999999994 L 404.7249762755026 182.69333333333327 L 409.359968846178 173.85333333333335 L 410.9049663697365 153.2266666666667 L 412.4499638932949 148.69333333333338 L 413.9949614168534 147.78666666666675 L 415.53995894041185 153.2266666666667 L 420.1749515110873 147.55999999999995 L 421.7199490346457 151.64 L 423.2649465582042 150.50666666666666 L 424.80994408176264 149.60000000000002 L 426.35494160532113 135.77333333333343 L 434.1443041199284 135.54666666666662 L 435.68930164348683 127.84000000000003 L 437.2342991670453 127.15999999999997 L 441.8692917377207 130.55999999999995 L 443.4142892612792 127.15999999999997 L 444.9592867848376 148.01333333333332 L 446.5042843083961 159.12000000000012 L 448.04928183195454 160.9333333333334 L 452.68427440262997 165.46666666666658 L 454.2292719261884 169.09333333333336 L 455.7742694497469 176.12000000000012 L 457.31926697330533 166.8266666666667 L 458.86426449686377 166.60000000000002 L 463.4992570675392 160.48000000000002 L 465.0442545910976 166.8266666666667 L 466.5892521146561 162.2933333333333 L 469.67924716177305 149.60000000000002 L 474.3142397324484 151.8666666666668 L 475.8592372560069 154.5866666666667 L 477.40423477956534 138.7199999999999 L 478.94923230312384 133.95999999999992 L 480.4942298266823 122.1733333333334 L 485.1292223973577 120.13333333333333 L 486.67421992091613 106.53333333333342 L 488.2192174444746 104.26666666666677 L 489.76421496803306 110.15999999999997 L 491.30921249159155 102.45333333333338 L 495.9442050622669 96.33333333333337 L 497.4892025858254 101.09333333333336 L 499.03420010938385 91.57333333333338 L 500.57919763294234 101.31999999999994 L 502.1241951565008 55.306666666666615 L 506.7591877271762 58.48000000000002 L 508.30418525073463 56.89333333333332 L 509.8491827742931 43.293333333333294 L 511.39418029785156 48.280000000000086 L 511.39418029785156 272 L 0 272z"
                          fill="url(#SvgjsLinearGradient1631)"
                          fill-opacity="1"
                          stroke-opacity="1"
                          stroke-linecap="butt"
                          stroke-width="0"
                          stroke-dasharray="0"
                          class="apexcharts-area"
                          index="0"
                          clip-path="url(#gridRectMaskmfwh6jti)"
                          pathTo="M 0 205.13333333333333 L 1.5449975235584639 196.2933333333333 L 3.0899950471169277 199.91999999999996 L 4.634992570675392 202.86666666666667 L 9.269985141350784 204 L 10.814982664909248 205.13333333333333 L 12.359980188467711 198.56000000000006 L 13.904977712026175 197.42666666666673 L 15.44997523558464 184.73333333333335 L 20.084967806260032 184.50666666666666 L 21.629965329818496 174.98666666666668 L 23.17496285337696 179.0666666666666 L 24.719960376935422 166.60000000000002 L 26.264957900493886 176.57333333333327 L 30.89995047116928 173.39999999999998 L 32.44494799472774 171.36 L 33.989945518286206 170.90666666666664 L 35.53494304184467 161.84000000000003 L 37.079940565403135 164.33333333333337 L 43.25993065963699 169.09333333333336 L 44.80492818319546 173.85333333333335 L 46.34992570675392 159.3466666666667 L 47.89492323031238 149.37333333333345 L 52.52991580098777 152.54666666666662 L 54.07491332454624 152.54666666666662 L 55.6199108481047 161.15999999999997 L 57.16490837166317 156.39999999999998 L 58.70990589522163 142.12000000000012 L 63.344898465897025 153.68000000000006 L 64.88989598945548 181.56000000000006 L 66.43489351301395 172.04000000000008 L 67.97989103657241 157.53333333333342 L 69.52488856013088 144.15999999999997 L 74.15988113080627 145.97333333333324 L 75.70487865436473 131.01333333333332 L 77.2498761779232 141.21333333333325 L 78.79487370148166 132.14666666666665 L 80.33987122504013 140.08000000000004 L 84.97486379571552 124.44000000000005 L 86.51986131927399 155.04000000000008 L 88.06485884283245 145.97333333333324 L 89.60985636639091 142.57333333333338 L 91.15485388994938 140.30666666666662 L 95.72547156380983 126.9333333333334 L 97.2704690873683 121.71999999999991 L 98.81546661092676 125.57333333333338 L 100.36046413448523 125.12000000000012 L 101.90546165804369 128.97333333333324 L 106.54045422871907 120.13333333333333 L 108.08545175227754 128.97333333333324 L 109.630449275836 148.24 L 111.17544679939446 145.2933333333333 L 117.35543689362832 153.68000000000006 L 118.90043441718679 167.50666666666666 L 120.44543194074525 158.44000000000005 L 121.99042946430372 146.20000000000005 L 123.53542698786218 154.5866666666667 L 128.17041955853756 162.2933333333333 L 129.71541708209602 139.62666666666655 L 131.2604146056545 149.8266666666667 L 132.80541212921295 160.7066666666667 L 134.35040965277142 157.30666666666662 L 138.9854022234468 167.2800000000001 L 140.53039974700528 172.26666666666677 L 142.07539727056374 155.7199999999999 L 143.6203947941222 152.77333333333343 L 145.16539231768067 145.5200000000001 L 149.80038488835606 146.20000000000005 L 151.34538241191453 141.21333333333325 L 152.890379935473 141.44000000000005 L 154.43537745903146 151.4133333333333 L 155.98037498258992 167.50666666666666 L 160.61536755326532 169.54666666666662 L 162.16036507682378 166.14666666666665 L 163.70536260038224 169.54666666666662 L 165.2503601239407 183.14666666666665 L 166.79535764749917 176.79999999999995 L 171.43035021817457 176.12000000000012 L 172.97534774173303 173.85333333333335 L 174.5203452652915 173.1733333333334 L 176.06534278884996 181.10666666666668 L 177.61034031240843 196.97333333333336 L 182.24533288308382 181.10666666666668 L 183.79033040664228 181.10666666666668 L 185.33532793020075 177.25333333333333 L 186.8803254537592 191.76 L 188.42532297731768 190.39999999999998 L 194.60531307155154 180.20000000000005 L 196.15031059511 197.42666666666673 L 197.69530811866846 202.86666666666667 L 199.24030564222693 230.74666666666667 L 203.8752982129023 219.64 L 205.42029573646076 210.80000000000007 L 206.96529326001922 188.36 L 208.5102907835777 196.74666666666667 L 210.05528830713615 189.26666666666665 L 214.69028087781155 201.0533333333334 L 216.23527840137 186.54666666666674 L 217.78027592492847 186.09333333333336 L 219.32527344848694 188.81333333333328 L 220.8702709720454 172.49333333333334 L 225.5052635427208 167.05333333333328 L 227.05026106627926 161.15999999999997 L 228.59525858983773 181.56000000000006 L 230.1402561133962 198.78666666666663 L 231.68525363695466 191.08000000000004 L 236.32024620763005 207.62666666666667 L 237.8652437311885 202.4133333333333 L 239.41024125474698 194.7066666666667 L 240.95523877830544 200.14666666666665 L 242.5002363018639 172.94666666666672 L 247.1352288725393 177.02666666666676 L 248.68022639609777 169.77333333333343 L 251.7702214432147 169.31999999999994 L 253.31521896677316 195.61333333333334 L 257.9502115374485 216.91999999999996 L 259.495209061007 216.69333333333327 L 261.04020658456545 222.13333333333333 L 262.58520410812395 223.49333333333334 L 264.1302016316824 211.9333333333334 L 268.7651942023578 217.60000000000002 L 270.31019172591624 211.9333333333334 L 271.85518924947473 194.25333333333333 L 273.40018677303317 183.8266666666667 L 274.94518429659166 195.38666666666666 L 279.580176867267 212.15999999999997 L 281.1251743908255 226.21333333333337 L 282.67017191438396 219.18666666666672 L 284.21516943794245 205.13333333333333 L 285.7601669615009 183.8266666666667 L 290.3951595321763 203.7733333333333 L 291.94015705573474 206.72000000000003 L 293.48515457929324 211.02666666666664 L 295.0301521028517 213.5200000000001 L 296.57514962641017 180.87999999999988 L 301.21014219708553 178.15999999999997 L 302.755139720644 172.94666666666672 L 304.30013724420246 169.77333333333343 L 305.84513476776095 166.60000000000002 L 307.3901322913194 166.8266666666667 L 312.0251248619948 175.21333333333325 L 313.57012238555325 179.0666666666666 L 315.1151199091117 160.7066666666667 L 316.6601174326702 143.9333333333334 L 318.2051149562286 140.53333333333342 L 322.84010752690403 137.81333333333328 L 324.38510505046247 141.66666666666663 L 325.93010257402096 139.62666666666655 L 327.4751000975794 147.33333333333337 L 329.0200976211379 175.44000000000005 L 333.65509019181326 174.08000000000004 L 335.20008771537175 179.97333333333324 L 336.7450852389302 182.24 L 338.2900827624887 193.57333333333327 L 339.8350802860471 197.88 L 346.015070380281 194.25333333333333 L 347.56006790383947 175.44000000000005 L 349.1050654273979 163.42666666666673 L 350.6500629509564 170.90666666666664 L 355.28505552163176 178.38666666666666 L 356.83005304519025 171.5866666666667 L 358.3750505687487 171.81333333333328 L 359.9200480923072 162.97333333333324 L 361.4650456158656 150.95999999999992 L 366.10003818654104 149.37333333333345 L 367.6450357100995 168.4133333333333 L 369.19003323365797 155.94666666666672 L 370.7350307572164 123.98666666666668 L 372.2800282807749 139.85333333333335 L 376.91502085145027 149.37333333333345 L 378.46001837500876 160.9333333333334 L 380.0050158985672 169.31999999999994 L 381.5500134221257 163.20000000000005 L 383.0950109456841 171.36 L 387.73000351635955 167.2800000000001 L 389.275001039918 168.4133333333333 L 390.8199985634764 167.73333333333335 L 392.3649960870349 165.92000000000007 L 393.90999361059335 170.68000000000006 L 398.54498618126877 176.12000000000012 L 400.0899837048272 188.5866666666667 L 401.6349812283857 192.43999999999994 L 403.17997875194413 186.31999999999994 L 404.7249762755026 182.69333333333327 L 409.359968846178 173.85333333333335 L 410.9049663697365 153.2266666666667 L 412.4499638932949 148.69333333333338 L 413.9949614168534 147.78666666666675 L 415.53995894041185 153.2266666666667 L 420.1749515110873 147.55999999999995 L 421.7199490346457 151.64 L 423.2649465582042 150.50666666666666 L 424.80994408176264 149.60000000000002 L 426.35494160532113 135.77333333333343 L 434.1443041199284 135.54666666666662 L 435.68930164348683 127.84000000000003 L 437.2342991670453 127.15999999999997 L 441.8692917377207 130.55999999999995 L 443.4142892612792 127.15999999999997 L 444.9592867848376 148.01333333333332 L 446.5042843083961 159.12000000000012 L 448.04928183195454 160.9333333333334 L 452.68427440262997 165.46666666666658 L 454.2292719261884 169.09333333333336 L 455.7742694497469 176.12000000000012 L 457.31926697330533 166.8266666666667 L 458.86426449686377 166.60000000000002 L 463.4992570675392 160.48000000000002 L 465.0442545910976 166.8266666666667 L 466.5892521146561 162.2933333333333 L 469.67924716177305 149.60000000000002 L 474.3142397324484 151.8666666666668 L 475.8592372560069 154.5866666666667 L 477.40423477956534 138.7199999999999 L 478.94923230312384 133.95999999999992 L 480.4942298266823 122.1733333333334 L 485.1292223973577 120.13333333333333 L 486.67421992091613 106.53333333333342 L 488.2192174444746 104.26666666666677 L 489.76421496803306 110.15999999999997 L 491.30921249159155 102.45333333333338 L 495.9442050622669 96.33333333333337 L 497.4892025858254 101.09333333333336 L 499.03420010938385 91.57333333333338 L 500.57919763294234 101.31999999999994 L 502.1241951565008 55.306666666666615 L 506.7591877271762 58.48000000000002 L 508.30418525073463 56.89333333333332 L 509.8491827742931 43.293333333333294 L 511.39418029785156 48.280000000000086 L 511.39418029785156 272 L 0 272z"
                          pathFrom="M 0 205.13333333333333 L 2.6356319646460773 196.2933333333333 L 5.271263929292155 199.91999999999996 L 7.9068958939382314 202.86666666666667 L 15.813791787876463 204 L 18.44942375252254 205.13333333333333 L 21.08505571716862 198.56000000000006 L 23.720687681814695 197.42666666666673 L 26.356319646460772 184.73333333333335 L 34.263215540399 184.50666666666666 L 36.89884750504508 174.98666666666668 L 39.534479469691156 179.0666666666666 L 42.17011143433724 166.60000000000002 L 44.80574339898331 176.57333333333327 L 52.712639292921544 173.39999999999998 L 55.348271257567625 171.36 L 57.9839032222137 170.90666666666664 L 60.61953518685978 161.84000000000003 L 63.25516715150585 164.33333333333337 L 73.79769501009017 169.09333333333336 L 76.43332697473625 173.85333333333335 L 79.06895893938231 159.3466666666667 L 81.7045909040284 149.37333333333345 L 89.61148679796662 152.54666666666662 L 92.2471187626127 152.54666666666662 L 94.88275072725878 161.15999999999997 L 97.51838269190486 156.39999999999998 L 100.15401465655094 142.12000000000012 L 108.06091055048917 153.68000000000006 L 110.69654251513525 181.56000000000006 L 113.33217447978132 172.04000000000008 L 115.9678064444274 157.53333333333342 L 118.60343840907348 144.15999999999997 L 126.5103343030117 145.97333333333324 L 129.1459662676578 131.01333333333332 L 131.78159823230385 141.21333333333325 L 134.41723019694993 132.14666666666665 L 137.052862161596 140.08000000000004 L 144.95975805553425 124.44000000000005 L 147.59539002018033 155.04000000000008 L 150.2310219848264 145.97333333333324 L 152.8666539494725 142.57333333333338 L 155.50228591411854 140.30666666666662 L 163.29936380952986 126.9333333333334 L 165.93499577417595 121.71999999999991 L 168.57062773882203 125.57333333333338 L 171.2062597034681 125.12000000000012 L 173.8418916681142 128.97333333333324 L 181.7487875620524 120.13333333333333 L 184.38441952669848 128.97333333333324 L 187.02005149134456 148.24 L 189.65568345599064 145.2933333333333 L 200.19821131457496 153.68000000000006 L 202.833843279221 167.50666666666666 L 205.4694752438671 158.44000000000005 L 208.10510720851318 146.20000000000005 L 210.74073917315926 154.5866666666667 L 218.6476350670975 162.2933333333333 L 221.28326703174358 139.62666666666655 L 223.91889899638966 149.8266666666667 L 226.5545309610357 160.7066666666667 L 229.1901629256818 157.30666666666662 L 237.09705881962003 167.2800000000001 L 239.7326907842661 172.26666666666677 L 242.3683227489122 155.7199999999999 L 245.00395471355827 152.77333333333343 L 247.63958667820435 145.5200000000001 L 255.54648257214257 146.20000000000005 L 258.1821145367887 141.21333333333325 L 260.8177465014347 141.44000000000005 L 263.4533784660808 151.4133333333333 L 266.0890104307269 167.50666666666666 L 273.9959063246651 169.54666666666662 L 276.6315382893112 166.14666666666665 L 279.26717025395726 169.54666666666662 L 281.90280221860337 183.14666666666665 L 284.5384341832494 176.79999999999995 L 292.44533007718763 176.12000000000012 L 295.08096204183374 173.85333333333335 L 297.7165940064798 173.1733333333334 L 300.3522259711259 181.10666666666668 L 302.98785793577196 196.97333333333336 L 310.89475382971017 181.10666666666668 L 313.5303857943563 181.10666666666668 L 316.16601775900233 177.25333333333333 L 318.80164972364844 191.76 L 321.4372816882945 190.39999999999998 L 331.9798095468788 180.20000000000005 L 334.61544151152486 197.42666666666673 L 337.251073476171 202.86666666666667 L 339.886705440817 230.74666666666667 L 347.7936013347553 219.64 L 350.42923329940135 210.80000000000007 L 353.06486526404746 188.36 L 355.7004972286935 196.74666666666667 L 358.33612919333956 189.26666666666665 L 366.24302508727783 201.0533333333334 L 368.8786570519239 186.54666666666674 L 371.51428901657 186.09333333333336 L 374.14992098121604 188.81333333333328 L 376.78555294586215 172.49333333333334 L 384.69244883980036 167.05333333333328 L 387.3280808044464 161.15999999999997 L 389.9637127690925 181.56000000000006 L 392.5993447337386 198.78666666666663 L 395.2349766983847 191.08000000000004 L 403.1418725923229 207.62666666666667 L 405.77750455696895 202.4133333333333 L 408.41313652161506 194.7066666666667 L 411.0487684862611 200.14666666666665 L 413.6844004509072 172.94666666666672 L 421.59129634484543 177.02666666666676 L 424.22692830949154 169.77333333333343 L 429.49819223878364 169.31999999999994 L 432.13382420342975 195.61333333333334 L 440.04072009736797 216.91999999999996 L 442.6763520620141 216.69333333333327 L 445.3119840266601 222.13333333333333 L 447.94761599130624 223.49333333333334 L 450.5832479559523 211.9333333333334 L 458.4901438498905 217.60000000000002 L 461.1257758145366 211.9333333333334 L 463.76140777918266 194.25333333333333 L 466.39703974382877 183.8266666666667 L 469.0326717084748 195.38666666666666 L 476.93956760241304 212.15999999999997 L 479.57519956705914 226.21333333333337 L 482.2108315317052 219.18666666666672 L 484.8464634963513 205.13333333333333 L 487.48209546099736 183.8266666666667 L 495.3889913549356 203.7733333333333 L 498.0246233195817 206.72000000000003 L 500.66025528422773 211.02666666666664 L 503.29588724887384 213.5200000000001 L 505.9315192135199 180.87999999999988 L 513.8384151074581 178.15999999999997 L 516.4740470721042 172.94666666666672 L 519.1096790367503 169.77333333333343 L 521.7453110013963 166.60000000000002 L 524.3809429660424 166.8266666666667 L 532.2878388599806 175.21333333333325 L 534.9234708246267 179.0666666666666 L 537.5591027892729 160.7066666666667 L 540.194734753919 143.9333333333334 L 542.830366718565 140.53333333333342 L 550.7372626125032 137.81333333333328 L 553.3728945771493 141.66666666666663 L 556.0085265417954 139.62666666666655 L 558.6441585064415 147.33333333333337 L 561.2797904710875 175.44000000000005 L 569.1866863650257 174.08000000000004 L 571.8223183296718 179.97333333333324 L 574.4579502943179 182.24 L 577.093582258964 193.57333333333327 L 579.72921422361 197.88 L 590.2717420821944 194.25333333333333 L 592.9073740468405 175.44000000000005 L 595.5430060114866 163.42666666666673 L 598.1786379761326 170.90666666666664 L 606.0855338700709 178.38666666666666 L 608.7211658347169 171.5866666666667 L 611.356797799363 171.81333333333328 L 613.9924297640091 162.97333333333324 L 616.6280617286551 150.95999999999992 L 624.5349576225934 149.37333333333345 L 627.1705895872394 168.4133333333333 L 629.8062215518855 155.94666666666672 L 632.4418535165316 123.98666666666668 L 635.0774854811777 139.85333333333335 L 642.984381375116 149.37333333333345 L 645.620013339762 160.9333333333334 L 648.2556453044081 169.31999999999994 L 650.8912772690542 163.20000000000005 L 653.5269092337003 171.36 L 661.4338051276385 167.2800000000001 L 664.0694370922845 168.4133333333333 L 666.7050690569306 167.73333333333335 L 669.3407010215767 165.92000000000007 L 671.9763329862228 170.68000000000006 L 679.883228880161 176.12000000000012 L 682.5188608448071 188.5866666666667 L 685.1544928094531 192.43999999999994 L 687.7901247740992 186.31999999999994 L 690.4257567387453 182.69333333333327 L 698.3326526326836 173.85333333333335 L 700.9682845973297 153.2266666666667 L 703.6039165619757 148.69333333333338 L 706.2395485266218 147.78666666666675 L 708.8751804912679 153.2266666666667 L 716.7820763852061 147.55999999999995 L 719.4177083498522 151.64 L 722.0533403144982 150.50666666666666 L 724.6889722791443 149.60000000000002 L 727.3246042437904 135.77333333333343 L 740.6125820655477 135.54666666666662 L 743.2482140301938 127.84000000000003 L 745.8838459948398 127.15999999999997 L 753.7907418887781 130.55999999999995 L 756.4263738534241 127.15999999999997 L 759.0620058180702 148.01333333333332 L 761.6976377827164 159.12000000000012 L 764.3332697473624 160.9333333333334 L 772.2401656413007 165.46666666666658 L 774.8757976059467 169.09333333333336 L 777.5114295705928 176.12000000000012 L 780.1470615352389 166.8266666666667 L 782.7826934998849 166.60000000000002 L 790.6895893938232 160.48000000000002 L 793.3252213584692 166.8266666666667 L 795.9608533231153 162.2933333333333 L 801.2321172524075 149.60000000000002 L 809.1390131463457 151.8666666666668 L 811.7746451109917 154.5866666666667 L 814.4102770756379 138.7199999999999 L 817.045909040284 133.95999999999992 L 819.6815410049301 122.1733333333334 L 827.5884368988683 120.13333333333333 L 830.2240688635143 106.53333333333342 L 832.8597008281604 104.26666666666677 L 835.4953327928065 110.15999999999997 L 838.1309647574526 102.45333333333338 L 846.0378606513908 96.33333333333337 L 848.6734926160368 101.09333333333336 L 851.3091245806829 91.57333333333338 L 853.944756545329 101.31999999999994 L 856.5803885099751 55.306666666666615 L 864.4872844039133 58.48000000000002 L 867.1229163685595 56.89333333333332 L 869.7585483332055 43.293333333333294 L 872.3941802978516 48.280000000000086 L 872.3941802978516 272 L 0 272zz"
                        ></path>
                        <path
                          id="SvgjsPath1636"
                          d="M 0 205.13333333333333 L 1.5449975235584639 196.2933333333333 L 3.0899950471169277 199.91999999999996 L 4.634992570675392 202.86666666666667 L 9.269985141350784 204 L 10.814982664909248 205.13333333333333 L 12.359980188467711 198.56000000000006 L 13.904977712026175 197.42666666666673 L 15.44997523558464 184.73333333333335 L 20.084967806260032 184.50666666666666 L 21.629965329818496 174.98666666666668 L 23.17496285337696 179.0666666666666 L 24.719960376935422 166.60000000000002 L 26.264957900493886 176.57333333333327 L 30.89995047116928 173.39999999999998 L 32.44494799472774 171.36 L 33.989945518286206 170.90666666666664 L 35.53494304184467 161.84000000000003 L 37.079940565403135 164.33333333333337 L 43.25993065963699 169.09333333333336 L 44.80492818319546 173.85333333333335 L 46.34992570675392 159.3466666666667 L 47.89492323031238 149.37333333333345 L 52.52991580098777 152.54666666666662 L 54.07491332454624 152.54666666666662 L 55.6199108481047 161.15999999999997 L 57.16490837166317 156.39999999999998 L 58.70990589522163 142.12000000000012 L 63.344898465897025 153.68000000000006 L 64.88989598945548 181.56000000000006 L 66.43489351301395 172.04000000000008 L 67.97989103657241 157.53333333333342 L 69.52488856013088 144.15999999999997 L 74.15988113080627 145.97333333333324 L 75.70487865436473 131.01333333333332 L 77.2498761779232 141.21333333333325 L 78.79487370148166 132.14666666666665 L 80.33987122504013 140.08000000000004 L 84.97486379571552 124.44000000000005 L 86.51986131927399 155.04000000000008 L 88.06485884283245 145.97333333333324 L 89.60985636639091 142.57333333333338 L 91.15485388994938 140.30666666666662 L 95.72547156380983 126.9333333333334 L 97.2704690873683 121.71999999999991 L 98.81546661092676 125.57333333333338 L 100.36046413448523 125.12000000000012 L 101.90546165804369 128.97333333333324 L 106.54045422871907 120.13333333333333 L 108.08545175227754 128.97333333333324 L 109.630449275836 148.24 L 111.17544679939446 145.2933333333333 L 117.35543689362832 153.68000000000006 L 118.90043441718679 167.50666666666666 L 120.44543194074525 158.44000000000005 L 121.99042946430372 146.20000000000005 L 123.53542698786218 154.5866666666667 L 128.17041955853756 162.2933333333333 L 129.71541708209602 139.62666666666655 L 131.2604146056545 149.8266666666667 L 132.80541212921295 160.7066666666667 L 134.35040965277142 157.30666666666662 L 138.9854022234468 167.2800000000001 L 140.53039974700528 172.26666666666677 L 142.07539727056374 155.7199999999999 L 143.6203947941222 152.77333333333343 L 145.16539231768067 145.5200000000001 L 149.80038488835606 146.20000000000005 L 151.34538241191453 141.21333333333325 L 152.890379935473 141.44000000000005 L 154.43537745903146 151.4133333333333 L 155.98037498258992 167.50666666666666 L 160.61536755326532 169.54666666666662 L 162.16036507682378 166.14666666666665 L 163.70536260038224 169.54666666666662 L 165.2503601239407 183.14666666666665 L 166.79535764749917 176.79999999999995 L 171.43035021817457 176.12000000000012 L 172.97534774173303 173.85333333333335 L 174.5203452652915 173.1733333333334 L 176.06534278884996 181.10666666666668 L 177.61034031240843 196.97333333333336 L 182.24533288308382 181.10666666666668 L 183.79033040664228 181.10666666666668 L 185.33532793020075 177.25333333333333 L 186.8803254537592 191.76 L 188.42532297731768 190.39999999999998 L 194.60531307155154 180.20000000000005 L 196.15031059511 197.42666666666673 L 197.69530811866846 202.86666666666667 L 199.24030564222693 230.74666666666667 L 203.8752982129023 219.64 L 205.42029573646076 210.80000000000007 L 206.96529326001922 188.36 L 208.5102907835777 196.74666666666667 L 210.05528830713615 189.26666666666665 L 214.69028087781155 201.0533333333334 L 216.23527840137 186.54666666666674 L 217.78027592492847 186.09333333333336 L 219.32527344848694 188.81333333333328 L 220.8702709720454 172.49333333333334 L 225.5052635427208 167.05333333333328 L 227.05026106627926 161.15999999999997 L 228.59525858983773 181.56000000000006 L 230.1402561133962 198.78666666666663 L 231.68525363695466 191.08000000000004 L 236.32024620763005 207.62666666666667 L 237.8652437311885 202.4133333333333 L 239.41024125474698 194.7066666666667 L 240.95523877830544 200.14666666666665 L 242.5002363018639 172.94666666666672 L 247.1352288725393 177.02666666666676 L 248.68022639609777 169.77333333333343 L 251.7702214432147 169.31999999999994 L 253.31521896677316 195.61333333333334 L 257.9502115374485 216.91999999999996 L 259.495209061007 216.69333333333327 L 261.04020658456545 222.13333333333333 L 262.58520410812395 223.49333333333334 L 264.1302016316824 211.9333333333334 L 268.7651942023578 217.60000000000002 L 270.31019172591624 211.9333333333334 L 271.85518924947473 194.25333333333333 L 273.40018677303317 183.8266666666667 L 274.94518429659166 195.38666666666666 L 279.580176867267 212.15999999999997 L 281.1251743908255 226.21333333333337 L 282.67017191438396 219.18666666666672 L 284.21516943794245 205.13333333333333 L 285.7601669615009 183.8266666666667 L 290.3951595321763 203.7733333333333 L 291.94015705573474 206.72000000000003 L 293.48515457929324 211.02666666666664 L 295.0301521028517 213.5200000000001 L 296.57514962641017 180.87999999999988 L 301.21014219708553 178.15999999999997 L 302.755139720644 172.94666666666672 L 304.30013724420246 169.77333333333343 L 305.84513476776095 166.60000000000002 L 307.3901322913194 166.8266666666667 L 312.0251248619948 175.21333333333325 L 313.57012238555325 179.0666666666666 L 315.1151199091117 160.7066666666667 L 316.6601174326702 143.9333333333334 L 318.2051149562286 140.53333333333342 L 322.84010752690403 137.81333333333328 L 324.38510505046247 141.66666666666663 L 325.93010257402096 139.62666666666655 L 327.4751000975794 147.33333333333337 L 329.0200976211379 175.44000000000005 L 333.65509019181326 174.08000000000004 L 335.20008771537175 179.97333333333324 L 336.7450852389302 182.24 L 338.2900827624887 193.57333333333327 L 339.8350802860471 197.88 L 346.015070380281 194.25333333333333 L 347.56006790383947 175.44000000000005 L 349.1050654273979 163.42666666666673 L 350.6500629509564 170.90666666666664 L 355.28505552163176 178.38666666666666 L 356.83005304519025 171.5866666666667 L 358.3750505687487 171.81333333333328 L 359.9200480923072 162.97333333333324 L 361.4650456158656 150.95999999999992 L 366.10003818654104 149.37333333333345 L 367.6450357100995 168.4133333333333 L 369.19003323365797 155.94666666666672 L 370.7350307572164 123.98666666666668 L 372.2800282807749 139.85333333333335 L 376.91502085145027 149.37333333333345 L 378.46001837500876 160.9333333333334 L 380.0050158985672 169.31999999999994 L 381.5500134221257 163.20000000000005 L 383.0950109456841 171.36 L 387.73000351635955 167.2800000000001 L 389.275001039918 168.4133333333333 L 390.8199985634764 167.73333333333335 L 392.3649960870349 165.92000000000007 L 393.90999361059335 170.68000000000006 L 398.54498618126877 176.12000000000012 L 400.0899837048272 188.5866666666667 L 401.6349812283857 192.43999999999994 L 403.17997875194413 186.31999999999994 L 404.7249762755026 182.69333333333327 L 409.359968846178 173.85333333333335 L 410.9049663697365 153.2266666666667 L 412.4499638932949 148.69333333333338 L 413.9949614168534 147.78666666666675 L 415.53995894041185 153.2266666666667 L 420.1749515110873 147.55999999999995 L 421.7199490346457 151.64 L 423.2649465582042 150.50666666666666 L 424.80994408176264 149.60000000000002 L 426.35494160532113 135.77333333333343 L 434.1443041199284 135.54666666666662 L 435.68930164348683 127.84000000000003 L 437.2342991670453 127.15999999999997 L 441.8692917377207 130.55999999999995 L 443.4142892612792 127.15999999999997 L 444.9592867848376 148.01333333333332 L 446.5042843083961 159.12000000000012 L 448.04928183195454 160.9333333333334 L 452.68427440262997 165.46666666666658 L 454.2292719261884 169.09333333333336 L 455.7742694497469 176.12000000000012 L 457.31926697330533 166.8266666666667 L 458.86426449686377 166.60000000000002 L 463.4992570675392 160.48000000000002 L 465.0442545910976 166.8266666666667 L 466.5892521146561 162.2933333333333 L 469.67924716177305 149.60000000000002 L 474.3142397324484 151.8666666666668 L 475.8592372560069 154.5866666666667 L 477.40423477956534 138.7199999999999 L 478.94923230312384 133.95999999999992 L 480.4942298266823 122.1733333333334 L 485.1292223973577 120.13333333333333 L 486.67421992091613 106.53333333333342 L 488.2192174444746 104.26666666666677 L 489.76421496803306 110.15999999999997 L 491.30921249159155 102.45333333333338 L 495.9442050622669 96.33333333333337 L 497.4892025858254 101.09333333333336 L 499.03420010938385 91.57333333333338 L 500.57919763294234 101.31999999999994 L 502.1241951565008 55.306666666666615 L 506.7591877271762 58.48000000000002 L 508.30418525073463 56.89333333333332 L 509.8491827742931 43.293333333333294 L 511.39418029785156 48.280000000000086"
                          fill="none"
                          fill-opacity="1"
                          stroke="#465fff"
                          stroke-opacity="1"
                          stroke-linecap="butt"
                          stroke-width="1"
                          stroke-dasharray="0"
                          class="apexcharts-area"
                          index="0"
                          clip-path="url(#gridRectMaskmfwh6jti)"
                          pathTo="M 0 205.13333333333333 L 1.5449975235584639 196.2933333333333 L 3.0899950471169277 199.91999999999996 L 4.634992570675392 202.86666666666667 L 9.269985141350784 204 L 10.814982664909248 205.13333333333333 L 12.359980188467711 198.56000000000006 L 13.904977712026175 197.42666666666673 L 15.44997523558464 184.73333333333335 L 20.084967806260032 184.50666666666666 L 21.629965329818496 174.98666666666668 L 23.17496285337696 179.0666666666666 L 24.719960376935422 166.60000000000002 L 26.264957900493886 176.57333333333327 L 30.89995047116928 173.39999999999998 L 32.44494799472774 171.36 L 33.989945518286206 170.90666666666664 L 35.53494304184467 161.84000000000003 L 37.079940565403135 164.33333333333337 L 43.25993065963699 169.09333333333336 L 44.80492818319546 173.85333333333335 L 46.34992570675392 159.3466666666667 L 47.89492323031238 149.37333333333345 L 52.52991580098777 152.54666666666662 L 54.07491332454624 152.54666666666662 L 55.6199108481047 161.15999999999997 L 57.16490837166317 156.39999999999998 L 58.70990589522163 142.12000000000012 L 63.344898465897025 153.68000000000006 L 64.88989598945548 181.56000000000006 L 66.43489351301395 172.04000000000008 L 67.97989103657241 157.53333333333342 L 69.52488856013088 144.15999999999997 L 74.15988113080627 145.97333333333324 L 75.70487865436473 131.01333333333332 L 77.2498761779232 141.21333333333325 L 78.79487370148166 132.14666666666665 L 80.33987122504013 140.08000000000004 L 84.97486379571552 124.44000000000005 L 86.51986131927399 155.04000000000008 L 88.06485884283245 145.97333333333324 L 89.60985636639091 142.57333333333338 L 91.15485388994938 140.30666666666662 L 95.72547156380983 126.9333333333334 L 97.2704690873683 121.71999999999991 L 98.81546661092676 125.57333333333338 L 100.36046413448523 125.12000000000012 L 101.90546165804369 128.97333333333324 L 106.54045422871907 120.13333333333333 L 108.08545175227754 128.97333333333324 L 109.630449275836 148.24 L 111.17544679939446 145.2933333333333 L 117.35543689362832 153.68000000000006 L 118.90043441718679 167.50666666666666 L 120.44543194074525 158.44000000000005 L 121.99042946430372 146.20000000000005 L 123.53542698786218 154.5866666666667 L 128.17041955853756 162.2933333333333 L 129.71541708209602 139.62666666666655 L 131.2604146056545 149.8266666666667 L 132.80541212921295 160.7066666666667 L 134.35040965277142 157.30666666666662 L 138.9854022234468 167.2800000000001 L 140.53039974700528 172.26666666666677 L 142.07539727056374 155.7199999999999 L 143.6203947941222 152.77333333333343 L 145.16539231768067 145.5200000000001 L 149.80038488835606 146.20000000000005 L 151.34538241191453 141.21333333333325 L 152.890379935473 141.44000000000005 L 154.43537745903146 151.4133333333333 L 155.98037498258992 167.50666666666666 L 160.61536755326532 169.54666666666662 L 162.16036507682378 166.14666666666665 L 163.70536260038224 169.54666666666662 L 165.2503601239407 183.14666666666665 L 166.79535764749917 176.79999999999995 L 171.43035021817457 176.12000000000012 L 172.97534774173303 173.85333333333335 L 174.5203452652915 173.1733333333334 L 176.06534278884996 181.10666666666668 L 177.61034031240843 196.97333333333336 L 182.24533288308382 181.10666666666668 L 183.79033040664228 181.10666666666668 L 185.33532793020075 177.25333333333333 L 186.8803254537592 191.76 L 188.42532297731768 190.39999999999998 L 194.60531307155154 180.20000000000005 L 196.15031059511 197.42666666666673 L 197.69530811866846 202.86666666666667 L 199.24030564222693 230.74666666666667 L 203.8752982129023 219.64 L 205.42029573646076 210.80000000000007 L 206.96529326001922 188.36 L 208.5102907835777 196.74666666666667 L 210.05528830713615 189.26666666666665 L 214.69028087781155 201.0533333333334 L 216.23527840137 186.54666666666674 L 217.78027592492847 186.09333333333336 L 219.32527344848694 188.81333333333328 L 220.8702709720454 172.49333333333334 L 225.5052635427208 167.05333333333328 L 227.05026106627926 161.15999999999997 L 228.59525858983773 181.56000000000006 L 230.1402561133962 198.78666666666663 L 231.68525363695466 191.08000000000004 L 236.32024620763005 207.62666666666667 L 237.8652437311885 202.4133333333333 L 239.41024125474698 194.7066666666667 L 240.95523877830544 200.14666666666665 L 242.5002363018639 172.94666666666672 L 247.1352288725393 177.02666666666676 L 248.68022639609777 169.77333333333343 L 251.7702214432147 169.31999999999994 L 253.31521896677316 195.61333333333334 L 257.9502115374485 216.91999999999996 L 259.495209061007 216.69333333333327 L 261.04020658456545 222.13333333333333 L 262.58520410812395 223.49333333333334 L 264.1302016316824 211.9333333333334 L 268.7651942023578 217.60000000000002 L 270.31019172591624 211.9333333333334 L 271.85518924947473 194.25333333333333 L 273.40018677303317 183.8266666666667 L 274.94518429659166 195.38666666666666 L 279.580176867267 212.15999999999997 L 281.1251743908255 226.21333333333337 L 282.67017191438396 219.18666666666672 L 284.21516943794245 205.13333333333333 L 285.7601669615009 183.8266666666667 L 290.3951595321763 203.7733333333333 L 291.94015705573474 206.72000000000003 L 293.48515457929324 211.02666666666664 L 295.0301521028517 213.5200000000001 L 296.57514962641017 180.87999999999988 L 301.21014219708553 178.15999999999997 L 302.755139720644 172.94666666666672 L 304.30013724420246 169.77333333333343 L 305.84513476776095 166.60000000000002 L 307.3901322913194 166.8266666666667 L 312.0251248619948 175.21333333333325 L 313.57012238555325 179.0666666666666 L 315.1151199091117 160.7066666666667 L 316.6601174326702 143.9333333333334 L 318.2051149562286 140.53333333333342 L 322.84010752690403 137.81333333333328 L 324.38510505046247 141.66666666666663 L 325.93010257402096 139.62666666666655 L 327.4751000975794 147.33333333333337 L 329.0200976211379 175.44000000000005 L 333.65509019181326 174.08000000000004 L 335.20008771537175 179.97333333333324 L 336.7450852389302 182.24 L 338.2900827624887 193.57333333333327 L 339.8350802860471 197.88 L 346.015070380281 194.25333333333333 L 347.56006790383947 175.44000000000005 L 349.1050654273979 163.42666666666673 L 350.6500629509564 170.90666666666664 L 355.28505552163176 178.38666666666666 L 356.83005304519025 171.5866666666667 L 358.3750505687487 171.81333333333328 L 359.9200480923072 162.97333333333324 L 361.4650456158656 150.95999999999992 L 366.10003818654104 149.37333333333345 L 367.6450357100995 168.4133333333333 L 369.19003323365797 155.94666666666672 L 370.7350307572164 123.98666666666668 L 372.2800282807749 139.85333333333335 L 376.91502085145027 149.37333333333345 L 378.46001837500876 160.9333333333334 L 380.0050158985672 169.31999999999994 L 381.5500134221257 163.20000000000005 L 383.0950109456841 171.36 L 387.73000351635955 167.2800000000001 L 389.275001039918 168.4133333333333 L 390.8199985634764 167.73333333333335 L 392.3649960870349 165.92000000000007 L 393.90999361059335 170.68000000000006 L 398.54498618126877 176.12000000000012 L 400.0899837048272 188.5866666666667 L 401.6349812283857 192.43999999999994 L 403.17997875194413 186.31999999999994 L 404.7249762755026 182.69333333333327 L 409.359968846178 173.85333333333335 L 410.9049663697365 153.2266666666667 L 412.4499638932949 148.69333333333338 L 413.9949614168534 147.78666666666675 L 415.53995894041185 153.2266666666667 L 420.1749515110873 147.55999999999995 L 421.7199490346457 151.64 L 423.2649465582042 150.50666666666666 L 424.80994408176264 149.60000000000002 L 426.35494160532113 135.77333333333343 L 434.1443041199284 135.54666666666662 L 435.68930164348683 127.84000000000003 L 437.2342991670453 127.15999999999997 L 441.8692917377207 130.55999999999995 L 443.4142892612792 127.15999999999997 L 444.9592867848376 148.01333333333332 L 446.5042843083961 159.12000000000012 L 448.04928183195454 160.9333333333334 L 452.68427440262997 165.46666666666658 L 454.2292719261884 169.09333333333336 L 455.7742694497469 176.12000000000012 L 457.31926697330533 166.8266666666667 L 458.86426449686377 166.60000000000002 L 463.4992570675392 160.48000000000002 L 465.0442545910976 166.8266666666667 L 466.5892521146561 162.2933333333333 L 469.67924716177305 149.60000000000002 L 474.3142397324484 151.8666666666668 L 475.8592372560069 154.5866666666667 L 477.40423477956534 138.7199999999999 L 478.94923230312384 133.95999999999992 L 480.4942298266823 122.1733333333334 L 485.1292223973577 120.13333333333333 L 486.67421992091613 106.53333333333342 L 488.2192174444746 104.26666666666677 L 489.76421496803306 110.15999999999997 L 491.30921249159155 102.45333333333338 L 495.9442050622669 96.33333333333337 L 497.4892025858254 101.09333333333336 L 499.03420010938385 91.57333333333338 L 500.57919763294234 101.31999999999994 L 502.1241951565008 55.306666666666615 L 506.7591877271762 58.48000000000002 L 508.30418525073463 56.89333333333332 L 509.8491827742931 43.293333333333294 L 511.39418029785156 48.280000000000086"
                          pathFrom="M 0 205.13333333333333 L 2.6356319646460773 196.2933333333333 L 5.271263929292155 199.91999999999996 L 7.9068958939382314 202.86666666666667 L 15.813791787876463 204 L 18.44942375252254 205.13333333333333 L 21.08505571716862 198.56000000000006 L 23.720687681814695 197.42666666666673 L 26.356319646460772 184.73333333333335 L 34.263215540399 184.50666666666666 L 36.89884750504508 174.98666666666668 L 39.534479469691156 179.0666666666666 L 42.17011143433724 166.60000000000002 L 44.80574339898331 176.57333333333327 L 52.712639292921544 173.39999999999998 L 55.348271257567625 171.36 L 57.9839032222137 170.90666666666664 L 60.61953518685978 161.84000000000003 L 63.25516715150585 164.33333333333337 L 73.79769501009017 169.09333333333336 L 76.43332697473625 173.85333333333335 L 79.06895893938231 159.3466666666667 L 81.7045909040284 149.37333333333345 L 89.61148679796662 152.54666666666662 L 92.2471187626127 152.54666666666662 L 94.88275072725878 161.15999999999997 L 97.51838269190486 156.39999999999998 L 100.15401465655094 142.12000000000012 L 108.06091055048917 153.68000000000006 L 110.69654251513525 181.56000000000006 L 113.33217447978132 172.04000000000008 L 115.9678064444274 157.53333333333342 L 118.60343840907348 144.15999999999997 L 126.5103343030117 145.97333333333324 L 129.1459662676578 131.01333333333332 L 131.78159823230385 141.21333333333325 L 134.41723019694993 132.14666666666665 L 137.052862161596 140.08000000000004 L 144.95975805553425 124.44000000000005 L 147.59539002018033 155.04000000000008 L 150.2310219848264 145.97333333333324 L 152.8666539494725 142.57333333333338 L 155.50228591411854 140.30666666666662 L 163.29936380952986 126.9333333333334 L 165.93499577417595 121.71999999999991 L 168.57062773882203 125.57333333333338 L 171.2062597034681 125.12000000000012 L 173.8418916681142 128.97333333333324 L 181.7487875620524 120.13333333333333 L 184.38441952669848 128.97333333333324 L 187.02005149134456 148.24 L 189.65568345599064 145.2933333333333 L 200.19821131457496 153.68000000000006 L 202.833843279221 167.50666666666666 L 205.4694752438671 158.44000000000005 L 208.10510720851318 146.20000000000005 L 210.74073917315926 154.5866666666667 L 218.6476350670975 162.2933333333333 L 221.28326703174358 139.62666666666655 L 223.91889899638966 149.8266666666667 L 226.5545309610357 160.7066666666667 L 229.1901629256818 157.30666666666662 L 237.09705881962003 167.2800000000001 L 239.7326907842661 172.26666666666677 L 242.3683227489122 155.7199999999999 L 245.00395471355827 152.77333333333343 L 247.63958667820435 145.5200000000001 L 255.54648257214257 146.20000000000005 L 258.1821145367887 141.21333333333325 L 260.8177465014347 141.44000000000005 L 263.4533784660808 151.4133333333333 L 266.0890104307269 167.50666666666666 L 273.9959063246651 169.54666666666662 L 276.6315382893112 166.14666666666665 L 279.26717025395726 169.54666666666662 L 281.90280221860337 183.14666666666665 L 284.5384341832494 176.79999999999995 L 292.44533007718763 176.12000000000012 L 295.08096204183374 173.85333333333335 L 297.7165940064798 173.1733333333334 L 300.3522259711259 181.10666666666668 L 302.98785793577196 196.97333333333336 L 310.89475382971017 181.10666666666668 L 313.5303857943563 181.10666666666668 L 316.16601775900233 177.25333333333333 L 318.80164972364844 191.76 L 321.4372816882945 190.39999999999998 L 331.9798095468788 180.20000000000005 L 334.61544151152486 197.42666666666673 L 337.251073476171 202.86666666666667 L 339.886705440817 230.74666666666667 L 347.7936013347553 219.64 L 350.42923329940135 210.80000000000007 L 353.06486526404746 188.36 L 355.7004972286935 196.74666666666667 L 358.33612919333956 189.26666666666665 L 366.24302508727783 201.0533333333334 L 368.8786570519239 186.54666666666674 L 371.51428901657 186.09333333333336 L 374.14992098121604 188.81333333333328 L 376.78555294586215 172.49333333333334 L 384.69244883980036 167.05333333333328 L 387.3280808044464 161.15999999999997 L 389.9637127690925 181.56000000000006 L 392.5993447337386 198.78666666666663 L 395.2349766983847 191.08000000000004 L 403.1418725923229 207.62666666666667 L 405.77750455696895 202.4133333333333 L 408.41313652161506 194.7066666666667 L 411.0487684862611 200.14666666666665 L 413.6844004509072 172.94666666666672 L 421.59129634484543 177.02666666666676 L 424.22692830949154 169.77333333333343 L 429.49819223878364 169.31999999999994 L 432.13382420342975 195.61333333333334 L 440.04072009736797 216.91999999999996 L 442.6763520620141 216.69333333333327 L 445.3119840266601 222.13333333333333 L 447.94761599130624 223.49333333333334 L 450.5832479559523 211.9333333333334 L 458.4901438498905 217.60000000000002 L 461.1257758145366 211.9333333333334 L 463.76140777918266 194.25333333333333 L 466.39703974382877 183.8266666666667 L 469.0326717084748 195.38666666666666 L 476.93956760241304 212.15999999999997 L 479.57519956705914 226.21333333333337 L 482.2108315317052 219.18666666666672 L 484.8464634963513 205.13333333333333 L 487.48209546099736 183.8266666666667 L 495.3889913549356 203.7733333333333 L 498.0246233195817 206.72000000000003 L 500.66025528422773 211.02666666666664 L 503.29588724887384 213.5200000000001 L 505.9315192135199 180.87999999999988 L 513.8384151074581 178.15999999999997 L 516.4740470721042 172.94666666666672 L 519.1096790367503 169.77333333333343 L 521.7453110013963 166.60000000000002 L 524.3809429660424 166.8266666666667 L 532.2878388599806 175.21333333333325 L 534.9234708246267 179.0666666666666 L 537.5591027892729 160.7066666666667 L 540.194734753919 143.9333333333334 L 542.830366718565 140.53333333333342 L 550.7372626125032 137.81333333333328 L 553.3728945771493 141.66666666666663 L 556.0085265417954 139.62666666666655 L 558.6441585064415 147.33333333333337 L 561.2797904710875 175.44000000000005 L 569.1866863650257 174.08000000000004 L 571.8223183296718 179.97333333333324 L 574.4579502943179 182.24 L 577.093582258964 193.57333333333327 L 579.72921422361 197.88 L 590.2717420821944 194.25333333333333 L 592.9073740468405 175.44000000000005 L 595.5430060114866 163.42666666666673 L 598.1786379761326 170.90666666666664 L 606.0855338700709 178.38666666666666 L 608.7211658347169 171.5866666666667 L 611.356797799363 171.81333333333328 L 613.9924297640091 162.97333333333324 L 616.6280617286551 150.95999999999992 L 624.5349576225934 149.37333333333345 L 627.1705895872394 168.4133333333333 L 629.8062215518855 155.94666666666672 L 632.4418535165316 123.98666666666668 L 635.0774854811777 139.85333333333335 L 642.984381375116 149.37333333333345 L 645.620013339762 160.9333333333334 L 648.2556453044081 169.31999999999994 L 650.8912772690542 163.20000000000005 L 653.5269092337003 171.36 L 661.4338051276385 167.2800000000001 L 664.0694370922845 168.4133333333333 L 666.7050690569306 167.73333333333335 L 669.3407010215767 165.92000000000007 L 671.9763329862228 170.68000000000006 L 679.883228880161 176.12000000000012 L 682.5188608448071 188.5866666666667 L 685.1544928094531 192.43999999999994 L 687.7901247740992 186.31999999999994 L 690.4257567387453 182.69333333333327 L 698.3326526326836 173.85333333333335 L 700.9682845973297 153.2266666666667 L 703.6039165619757 148.69333333333338 L 706.2395485266218 147.78666666666675 L 708.8751804912679 153.2266666666667 L 716.7820763852061 147.55999999999995 L 719.4177083498522 151.64 L 722.0533403144982 150.50666666666666 L 724.6889722791443 149.60000000000002 L 727.3246042437904 135.77333333333343 L 740.6125820655477 135.54666666666662 L 743.2482140301938 127.84000000000003 L 745.8838459948398 127.15999999999997 L 753.7907418887781 130.55999999999995 L 756.4263738534241 127.15999999999997 L 759.0620058180702 148.01333333333332 L 761.6976377827164 159.12000000000012 L 764.3332697473624 160.9333333333334 L 772.2401656413007 165.46666666666658 L 774.8757976059467 169.09333333333336 L 777.5114295705928 176.12000000000012 L 780.1470615352389 166.8266666666667 L 782.7826934998849 166.60000000000002 L 790.6895893938232 160.48000000000002 L 793.3252213584692 166.8266666666667 L 795.9608533231153 162.2933333333333 L 801.2321172524075 149.60000000000002 L 809.1390131463457 151.8666666666668 L 811.7746451109917 154.5866666666667 L 814.4102770756379 138.7199999999999 L 817.045909040284 133.95999999999992 L 819.6815410049301 122.1733333333334 L 827.5884368988683 120.13333333333333 L 830.2240688635143 106.53333333333342 L 832.8597008281604 104.26666666666677 L 835.4953327928065 110.15999999999997 L 838.1309647574526 102.45333333333338 L 846.0378606513908 96.33333333333337 L 848.6734926160368 101.09333333333336 L 851.3091245806829 91.57333333333338 L 853.944756545329 101.31999999999994 L 856.5803885099751 55.306666666666615 L 864.4872844039133 58.48000000000002 L 867.1229163685595 56.89333333333332 L 869.7585483332055 43.293333333333294 L 872.3941802978516 48.280000000000086"
                          fill-rule="evenodd"
                        ></path>
                        <g id="SvgjsG1629" class="apexcharts-series-markers-wrap apexcharts-hidden-element-shown" data:realIndex="0">
                          <g class="apexcharts-series-markers">
                            <path
                              id="SvgjsPath1704"
                              d="M 0, 0 
           m -0, 0 
           a 0,0 0 1,0 0,0 
           a 0,0 0 1,0 -0,0"
                              fill="#465fff"
                              fill-opacity="1"
                              stroke="#ffffff"
                              stroke-opacity="0.9"
                              stroke-linecap="butt"
                              stroke-width="2"
                              stroke-dasharray="0"
                              cx="0"
                              cy="0"
                              shape="circle"
                              class="apexcharts-marker whduvilyx no-pointer-events"
                              default-marker-size="0"
                            ></path>
                          </g>
                        </g>
                      </g>
                      <g id="SvgjsG1630" class="apexcharts-datalabels" data:realIndex="0"></g>
                    </g>
                    <line
                      id="SvgjsLine1650"
                      x1="0"
                      y1="0"
                      x2="511.39418029785156"
                      y2="0"
                      stroke="#b6b6b6"
                      stroke-dasharray="0"
                      stroke-width="1"
                      stroke-linecap="butt"
                      class="apexcharts-ycrosshairs"
                    ></line>
                    <line id="SvgjsLine1651" x1="0" y1="0" x2="511.39418029785156" y2="0" stroke-dasharray="0" stroke-width="0" stroke-linecap="butt" class="apexcharts-ycrosshairs-hidden"></line>
                    <g id="SvgjsG1652" class="apexcharts-xaxis" transform="translate(0, 0)">
                      <g id="SvgjsG1653" class="apexcharts-xaxis-texts-g" transform="translate(0, -4)">
                        <text
                          id="SvgjsText1655"
                          font-family="Outfit, sans-serif"
                          x="46.349925706753915"
                          y="300"
                          text-anchor="middle"
                          dominant-baseline="auto"
                          font-size="12px"
                          font-weight="400"
                          fill="#373d3f"
                          class="apexcharts-text apexcharts-xaxis-label"
                          style="font-family: Outfit, sans-serif"
                        >
                          <tspan id="SvgjsTspan1656">Jun '25</tspan>
                          <title>Jun '25</title>
                        </text>
                        <text
                          id="SvgjsText1658"
                          font-family="Outfit, sans-serif"
                          x="92.69985141350783"
                          y="300"
                          text-anchor="middle"
                          dominant-baseline="auto"
                          font-size="12px"
                          font-weight="400"
                          fill="#373d3f"
                          class="apexcharts-text apexcharts-xaxis-label"
                          style="font-family: Outfit, sans-serif"
                        >
                          <tspan id="SvgjsTspan1659">Jul '25</tspan>
                          <title>Jul '25</title>
                        </text>
                        <text
                          id="SvgjsText1661"
                          font-family="Outfit, sans-serif"
                          x="140.59477464382022"
                          y="300"
                          text-anchor="middle"
                          dominant-baseline="auto"
                          font-size="12px"
                          font-weight="400"
                          fill="#373d3f"
                          class="apexcharts-text apexcharts-xaxis-label"
                          style="font-family: Outfit, sans-serif"
                        >
                          <tspan id="SvgjsTspan1662">Aug '25</tspan>
                          <title>Aug '25</title>
                        </text>
                        <text
                          id="SvgjsText1664"
                          font-family="Outfit, sans-serif"
                          x="234.8396235808865"
                          y="300"
                          text-anchor="middle"
                          dominant-baseline="auto"
                          font-size="12px"
                          font-weight="400"
                          fill="#373d3f"
                          class="apexcharts-text apexcharts-xaxis-label"
                          style="font-family: Outfit, sans-serif"
                        >
                          <tspan id="SvgjsTspan1665">Oct '25</tspan>
                          <title>Oct '25</title>
                        </text>
                        <text
                          id="SvgjsText1667"
                          font-family="Outfit, sans-serif"
                          x="282.73454681119887"
                          y="300"
                          text-anchor="middle"
                          dominant-baseline="auto"
                          font-size="12px"
                          font-weight="400"
                          fill="#373d3f"
                          class="apexcharts-text apexcharts-xaxis-label"
                          style="font-family: Outfit, sans-serif"
                        >
                          <tspan id="SvgjsTspan1668">Nov '25</tspan>
                          <title>Nov '25</title>
                        </text>
                        <text
                          id="SvgjsText1670"
                          font-family="Outfit, sans-serif"
                          x="376.9793957482652"
                          y="300"
                          text-anchor="middle"
                          dominant-baseline="auto"
                          font-size="12px"
                          font-weight="600"
                          fill="#373d3f"
                          class="apexcharts-text apexcharts-xaxis-label"
                          style="font-family: Outfit, sans-serif"
                        >
                          <tspan id="SvgjsTspan1671">2026</tspan>
                          <title>2026</title>
                        </text>
                        <text
                          id="SvgjsText1673"
                          font-family="Outfit, sans-serif"
                          x="424.87431897857755"
                          y="300"
                          text-anchor="middle"
                          dominant-baseline="auto"
                          font-size="12px"
                          font-weight="400"
                          fill="#373d3f"
                          class="apexcharts-text apexcharts-xaxis-label"
                          style="font-family: Outfit, sans-serif"
                        >
                          <tspan id="SvgjsTspan1674">Feb '26</tspan>
                          <title>Feb '26</title>
                        </text>
                        <text
                          id="SvgjsText1676"
                          font-family="Outfit, sans-serif"
                          x="516.029172868527"
                          y="300"
                          text-anchor="middle"
                          dominant-baseline="auto"
                          font-size="12px"
                          font-weight="400"
                          fill="#373d3f"
                          class="apexcharts-text apexcharts-xaxis-label"
                          style="font-family: Outfit, sans-serif"
                        >
                          <tspan id="SvgjsTspan1677"></tspan>
                          <title></title>
                        </text>
                      </g>
                    </g>
                    <g id="SvgjsG1701" class="apexcharts-yaxis-annotations"></g>
                    <g id="SvgjsG1702" class="apexcharts-xaxis-annotations"></g>
                    <g id="SvgjsG1703" class="apexcharts-point-annotations"></g>
                    <rect
                      id="SvgjsRect1705"
                      width="0"
                      height="0"
                      x="0"
                      y="0"
                      rx="0"
                      ry="0"
                      opacity="1"
                      stroke-width="0"
                      stroke="none"
                      stroke-dasharray="0"
                      fill="#fefefe"
                      class="apexcharts-zoom-rect"
                    ></rect>
                    <rect
                      id="SvgjsRect1706"
                      width="0"
                      height="0"
                      x="0"
                      y="0"
                      rx="0"
                      ry="0"
                      opacity="1"
                      stroke-width="0"
                      stroke="none"
                      stroke-dasharray="0"
                      fill="#fefefe"
                      class="apexcharts-selection-rect"
                    ></rect>
                  </g>
                </svg>
                <div class="apexcharts-tooltip apexcharts-theme-light">
                  <div class="apexcharts-tooltip-title" style="font-family: Outfit, sans-serif; font-size: 12px"></div>
                  <div class="apexcharts-tooltip-series-group apexcharts-tooltip-series-group-0" style="order: 1">
                    <span class="apexcharts-tooltip-marker" style="background-color: rgb(70, 95, 255)"></span>
                    <div class="apexcharts-tooltip-text" style="font-family: Outfit, sans-serif; font-size: 12px">
                      <div class="apexcharts-tooltip-y-group">
                        <span class="apexcharts-tooltip-text-y-label"></span>
                        <span class="apexcharts-tooltip-text-y-value"></span>
                      </div>
                      <div class="apexcharts-tooltip-goals-group">
                        <span class="apexcharts-tooltip-text-goals-label"></span>
                        <span class="apexcharts-tooltip-text-goals-value"></span>
                      </div>
                      <div class="apexcharts-tooltip-z-group">
                        <span class="apexcharts-tooltip-text-z-label"></span>
                        <span class="apexcharts-tooltip-text-z-value"></span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="apexcharts-yaxistooltip apexcharts-yaxistooltip-0 apexcharts-yaxistooltip-left apexcharts-theme-light">
                  <div class="apexcharts-yaxistooltip-text"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- ====== Chart Fourteen End -->

        <!-- ====== Trending Stocks Start -->
        <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div class="flex justify-between mb-6">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Trending Stocks</h3>

            <div class="stocks-slider-outer relative flex items-center gap-1.5">
              <div class="swiper-button-prev swiper-button-disabled">
                <svg class="stroke-current" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.1667 4L6 8.16667L10.1667 12.3333" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </div>

              <div class="swiper-button-next">
                <svg class="stroke-current" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.83333 12.6667L10 8.50002L5.83333 4.33335" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </div>
            </div>
          </div>

          <div class="stocksSlider swiper swiper-initialized swiper-horizontal swiper-backface-hidden">
            <div class="swiper-wrapper" style="transition-duration: 0ms; transform: translate3d(0px, 0px, 0px); transition-delay: 0ms">
              <!-- Stocks Item -->
              <div class="swiper-slide swiper-slide-active" style="width: 237.826px; margin-right: 20px">
                <div class="rounded-2xl bg-gray-100 p-5 dark:bg-white/[0.03]">
                  <div class="flex items-center justify-between pb-5 mb-5 border-b border-gray-200 dark:border-gray-800">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10">
                        <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg/images/brand/brand-09.svg" alt="brand" />
                      </div>

                      <div>
                        <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">TSLA</h3>
                        <span class="block text-gray-500 text-theme-xs dark:text-gray-400">Tesla, Inc</span>
                      </div>
                    </div>

                    <div>
                      <div>
                        <h4 class="mb-1 font-medium text-right text-gray-700 text-theme-sm dark:text-gray-400">$192.53</h4>
                      </div>

                      <span class="flex items-center justify-end gap-1 font-medium text-theme-xs text-success-600 dark:text-success-500">
                        <svg class="fill-current" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M5.56462 1.62394C5.70193 1.47073 5.90135 1.37433 6.12329 1.37433C6.1236 1.37433 6.12391 1.37433 6.12422 1.37433C6.31631 1.37416 6.50845 1.44732 6.65505 1.59381L9.65514 4.59181C9.94814 4.8846 9.94831 5.35947 9.65552 5.65247C9.36273 5.94546 8.88785 5.94563 8.59486 5.65284L6.87329 3.93248L6.87329 10.125C6.87329 10.5392 6.53751 10.875 6.12329 10.875C5.70908 10.875 5.37329 10.5392 5.37329 10.125L5.37329 3.93579L3.65516 5.65282C3.36218 5.94562 2.8873 5.94547 2.5945 5.65249C2.3017 5.3595 2.30185 4.88463 2.59484 4.59183L5.56462 1.62394Z"
                            fill=""
                          ></path>
                        </svg>

                        1.01%
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <button
                      class="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white p-3 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                    >
                      Short Stock
                    </button>

                    <button class="flex items-center justify-center w-full p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm shadow-theme-xs hover:bg-brand-600">Buy Stock</button>
                  </div>
                </div>
              </div>

              <!-- Stocks Item -->
              <div class="swiper-slide swiper-slide-next" style="width: 237.826px; margin-right: 20px">
                <div class="rounded-2xl bg-gray-100 p-5 dark:bg-white/[0.03]">
                  <div class="flex items-center justify-between pb-5 mb-5 border-b border-gray-200 dark:border-gray-800">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10">
                        <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg" alt="brand" />
                      </div>

                      <div>
                        <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">AAPL</h3>
                        <span class="block text-gray-500 text-theme-xs dark:text-gray-400">Apple, Inc</span>
                      </div>
                    </div>

                    <div>
                      <div>
                        <h4 class="mb-1 font-medium text-right text-gray-700 text-theme-sm dark:text-gray-400">$192.53</h4>
                      </div>

                      <span class="flex items-center justify-end gap-1 font-medium text-theme-xs text-success-600 dark:text-success-500">
                        <svg class="fill-current" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M5.56462 1.62394C5.70193 1.47073 5.90135 1.37433 6.12329 1.37433C6.1236 1.37433 6.12391 1.37433 6.12422 1.37433C6.31631 1.37416 6.50845 1.44732 6.65505 1.59381L9.65514 4.59181C9.94814 4.8846 9.94831 5.35947 9.65552 5.65247C9.36273 5.94546 8.88785 5.94563 8.59486 5.65284L6.87329 3.93248L6.87329 10.125C6.87329 10.5392 6.53751 10.875 6.12329 10.875C5.70908 10.875 5.37329 10.5392 5.37329 10.125L5.37329 3.93579L3.65516 5.65282C3.36218 5.94562 2.8873 5.94547 2.5945 5.65249C2.3017 5.3595 2.30185 4.88463 2.59484 4.59183L5.56462 1.62394Z"
                            fill=""
                          ></path>
                        </svg>

                        3.59%
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <button
                      class="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white p-3 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                    >
                      Short Stock
                    </button>

                    <button class="flex items-center justify-center w-full p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm shadow-theme-xs hover:bg-brand-600">Buy Stock</button>
                  </div>
                </div>
              </div>

              <!-- Stocks Item -->
              <div class="swiper-slide" style="width: 237.826px; margin-right: 20px">
                <div class="rounded-2xl bg-gray-100 p-5 dark:bg-white/[0.03]">
                  <div class="flex items-center justify-between pb-5 mb-5 border-b border-gray-200 dark:border-gray-800">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10">
                        <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg/images/brand/brand-11.svg" alt="brand" />
                      </div>

                      <div>
                        <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">SPOT</h3>
                        <span class="block text-gray-500 text-theme-xs dark:text-gray-400">Spotify, Inc</span>
                      </div>
                    </div>

                    <div>
                      <div>
                        <h4 class="mb-1 font-medium text-right text-gray-700 text-theme-sm dark:text-gray-400">$192.53</h4>
                      </div>

                      <span class="flex items-center justify-end gap-1 font-medium text-theme-xs text-success-600 dark:text-success-500">
                        <svg class="fill-current" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M5.56462 1.62394C5.70193 1.47073 5.90135 1.37433 6.12329 1.37433C6.1236 1.37433 6.12391 1.37433 6.12422 1.37433C6.31631 1.37416 6.50845 1.44732 6.65505 1.59381L9.65514 4.59181C9.94814 4.8846 9.94831 5.35947 9.65552 5.65247C9.36273 5.94546 8.88785 5.94563 8.59486 5.65284L6.87329 3.93248L6.87329 10.125C6.87329 10.5392 6.53751 10.875 6.12329 10.875C5.70908 10.875 5.37329 10.5392 5.37329 10.125L5.37329 3.93579L3.65516 5.65282C3.36218 5.94562 2.8873 5.94547 2.5945 5.65249C2.3017 5.3595 2.30185 4.88463 2.59484 4.59183L5.56462 1.62394Z"
                            fill=""
                          ></path>
                        </svg>

                        1.01%
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <button
                      class="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white p-3 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                    >
                      Short Stock
                    </button>

                    <button class="flex items-center justify-center w-full p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm shadow-theme-xs hover:bg-brand-600">Buy Stock</button>
                  </div>
                </div>
              </div>

              <!-- Stocks Item -->
              <div class="swiper-slide" style="width: 237.826px; margin-right: 20px">
                <div class="rounded-2xl bg-gray-100 p-5 dark:bg-white/[0.03]">
                  <div class="flex items-center justify-between pb-5 mb-5 border-b border-gray-200 dark:border-gray-800">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10">
                        <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg" alt="brand" />
                      </div>

                      <div>
                        <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">PYPL</h3>
                        <span class="block text-gray-500 text-theme-xs dark:text-gray-400">Paypal, Inc</span>
                      </div>
                    </div>

                    <div>
                      <div>
                        <h4 class="mb-1 font-medium text-right text-gray-700 text-theme-sm dark:text-gray-400">$192.53</h4>
                      </div>

                      <span class="flex items-center justify-end gap-1 font-medium text-theme-xs text-success-600 dark:text-success-500">
                        <svg class="fill-current" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M5.56462 1.62394C5.70193 1.47073 5.90135 1.37433 6.12329 1.37433C6.1236 1.37433 6.12391 1.37433 6.12422 1.37433C6.31631 1.37416 6.50845 1.44732 6.65505 1.59381L9.65514 4.59181C9.94814 4.8846 9.94831 5.35947 9.65552 5.65247C9.36273 5.94546 8.88785 5.94563 8.59486 5.65284L6.87329 3.93248L6.87329 10.125C6.87329 10.5392 6.53751 10.875 6.12329 10.875C5.70908 10.875 5.37329 10.5392 5.37329 10.125L5.37329 3.93579L3.65516 5.65282C3.36218 5.94562 2.8873 5.94547 2.5945 5.65249C2.3017 5.3595 2.30185 4.88463 2.59484 4.59183L5.56462 1.62394Z"
                            fill=""
                          ></path>
                        </svg>

                        1.01%
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <button
                      class="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white p-3 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                    >
                      Short Stock
                    </button>

                    <button class="flex items-center justify-center w-full p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm shadow-theme-xs hover:bg-brand-600">Buy Stock</button>
                  </div>
                </div>
              </div>

              <!-- Stocks Item -->
              <div class="swiper-slide" style="width: 237.826px; margin-right: 20px">
                <div class="rounded-2xl bg-gray-100 p-5 dark:bg-white/[0.03]">
                  <div class="flex items-center justify-between pb-5 mb-5 border-b border-gray-200 dark:border-gray-800">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10">
                        <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg" alt="brand" />
                      </div>

                      <div>
                        <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">AMZN</h3>
                        <span class="block text-gray-500 text-theme-xs dark:text-gray-400">Amazone, Inc</span>
                      </div>
                    </div>

                    <div>
                      <div>
                        <h4 class="mb-1 font-medium text-right text-gray-700 text-theme-sm dark:text-gray-400">$192.53</h4>
                      </div>

                      <span class="flex items-center justify-end gap-1 font-medium text-theme-xs text-success-600 dark:text-success-500">
                        <svg class="fill-current" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M5.56462 1.62394C5.70193 1.47073 5.90135 1.37433 6.12329 1.37433C6.1236 1.37433 6.12391 1.37433 6.12422 1.37433C6.31631 1.37416 6.50845 1.44732 6.65505 1.59381L9.65514 4.59181C9.94814 4.8846 9.94831 5.35947 9.65552 5.65247C9.36273 5.94546 8.88785 5.94563 8.59486 5.65284L6.87329 3.93248L6.87329 10.125C6.87329 10.5392 6.53751 10.875 6.12329 10.875C5.70908 10.875 5.37329 10.5392 5.37329 10.125L5.37329 3.93579L3.65516 5.65282C3.36218 5.94562 2.8873 5.94547 2.5945 5.65249C2.3017 5.3595 2.30185 4.88463 2.59484 4.59183L5.56462 1.62394Z"
                            fill=""
                          ></path>
                        </svg>

                        1.01%
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <button
                      class="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white p-3 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                    >
                      Short Stock
                    </button>

                    <button class="flex items-center justify-center w-full p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm shadow-theme-xs hover:bg-brand-600">Buy Stock</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- ====== Trending Stocks End -->
      </div>

      <div class="col-span-12 space-y-6 xl:col-span-4">
        <!-- ====== Chart Fifteen Start -->
        <div class="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Dividend</h3>

            <div x-data="{openDropDown: false}" class="relative">
              <button
                @click="openDropDown = !openDropDown"
                :class="openDropDown ? 'text-gray-700 dark:text-white' : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'"
                class="text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M10.2441 6C10.2441 5.0335 11.0276 4.25 11.9941 4.25H12.0041C12.9706 4.25 13.7541 5.0335 13.7541 6C13.7541 6.9665 12.9706 7.75 12.0041 7.75H11.9941C11.0276 7.75 10.2441 6.9665 10.2441 6ZM10.2441 18C10.2441 17.0335 11.0276 16.25 11.9941 16.25H12.0041C12.9706 16.25 13.7541 17.0335 13.7541 18C13.7541 18.9665 12.9706 19.75 12.0041 19.75H11.9941C11.0276 19.75 10.2441 18.9665 10.2441 18ZM11.9941 10.25C11.0276 10.25 10.2441 11.0335 10.2441 12C10.2441 12.9665 11.0276 13.75 11.9941 13.75H12.0041C12.9706 13.75 13.7541 12.9665 13.7541 12C13.7541 11.0335 12.9706 10.25 12.0041 10.25H11.9941Z"
                    fill=""
                  ></path>
                </svg>
              </button>
              <div
                x-show="openDropDown"
                @click.outside="openDropDown = false"
                class="absolute right-0 top-full z-40 w-40 space-y-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
                style="display: none"
              >
                <button
                  class="flex w-full rounded-lg px-3 py-2 text-left text-theme-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                >
                  View More
                </button>
                <button
                  class="flex w-full rounded-lg px-3 py-2 text-left text-theme-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
          <div>
            <div id="chartFifteen" class="-ml-5" style="min-height: 215px">
              <div id="apexchartsbeswf8b2" class="apexcharts-canvas apexchartsbeswf8b2 apexcharts-theme-" style="width: 270px; height: 200px">
                <svg
                  id="SvgjsSvg1707"
                  width="270"
                  height="200"
                  xmlns="http://www.w3.org/2000/svg"
                  version="1.1"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  xmlns:svgjs="http://svgjs.dev"
                  class="apexcharts-svg"
                  xmlns:data="ApexChartsNS"
                  transform="translate(0, 0)"
                >
                  <foreignObject x="0" y="0" width="270" height="200">
                    <div xmlns="http://www.w3.org/1999/xhtml" style="position: relative; height: 100%; width: 100%">
                      <div class="apexcharts-legend" style="max-height: 100px"></div>
                    </div>
                  </foreignObject>
                  <g id="SvgjsG1720" class="apexcharts-datalabels-group" transform="translate(0, 0) scale(1)"></g>
                  <g id="SvgjsG1721" class="apexcharts-datalabels-group" transform="translate(0, 0) scale(1)"></g>
                  <g id="SvgjsG1772" class="apexcharts-yaxis" rel="0" transform="translate(19.79388427734375, 0)">
                    <g id="SvgjsG1773" class="apexcharts-yaxis-texts-g">
                      <text
                        id="SvgjsText1775"
                        font-family="Outfit, sans-serif"
                        x="20"
                        y="33.666666666666664"
                        text-anchor="end"
                        dominant-baseline="auto"
                        font-size="11px"
                        font-weight="400"
                        fill="#373d3f"
                        class="apexcharts-text apexcharts-yaxis-label"
                        style="font-family: Outfit, sans-serif"
                      >
                        <tspan id="SvgjsTspan1776">400</tspan>
                        <title>400</title>
                      </text>
                      <text
                        id="SvgjsText1778"
                        font-family="Outfit, sans-serif"
                        x="20"
                        y="66.34916666666666"
                        text-anchor="end"
                        dominant-baseline="auto"
                        font-size="11px"
                        font-weight="400"
                        fill="#373d3f"
                        class="apexcharts-text apexcharts-yaxis-label"
                        style="font-family: Outfit, sans-serif"
                      >
                        <tspan id="SvgjsTspan1779">300</tspan>
                        <title>300</title>
                      </text>
                      <text
                        id="SvgjsText1781"
                        font-family="Outfit, sans-serif"
                        x="20"
                        y="99.03166666666667"
                        text-anchor="end"
                        dominant-baseline="auto"
                        font-size="11px"
                        font-weight="400"
                        fill="#373d3f"
                        class="apexcharts-text apexcharts-yaxis-label"
                        style="font-family: Outfit, sans-serif"
                      >
                        <tspan id="SvgjsTspan1782">200</tspan>
                        <title>200</title>
                      </text>
                      <text
                        id="SvgjsText1784"
                        font-family="Outfit, sans-serif"
                        x="20"
                        y="131.71416666666667"
                        text-anchor="end"
                        dominant-baseline="auto"
                        font-size="11px"
                        font-weight="400"
                        fill="#373d3f"
                        class="apexcharts-text apexcharts-yaxis-label"
                        style="font-family: Outfit, sans-serif"
                      >
                        <tspan id="SvgjsTspan1785">100</tspan>
                        <title>100</title>
                      </text>
                      <text
                        id="SvgjsText1787"
                        font-family="Outfit, sans-serif"
                        x="20"
                        y="164.39666666666668"
                        text-anchor="end"
                        dominant-baseline="auto"
                        font-size="11px"
                        font-weight="400"
                        fill="#373d3f"
                        class="apexcharts-text apexcharts-yaxis-label"
                        style="font-family: Outfit, sans-serif"
                      >
                        <tspan id="SvgjsTspan1788">0</tspan>
                        <title>0</title>
                      </text>
                    </g>
                  </g>
                  <g id="SvgjsG1709" class="apexcharts-inner apexcharts-graphical" transform="translate(49.79388427734375, 30)">
                    <defs id="SvgjsDefs1708">
                      <linearGradient id="SvgjsLinearGradient1712" x1="0" y1="0" x2="0" y2="1">
                        <stop id="SvgjsStop1713" stop-opacity="0.4" stop-color="rgba(216,227,240,0.4)" offset="0"></stop>
                        <stop id="SvgjsStop1714" stop-opacity="0.5" stop-color="rgba(190,209,230,0.5)" offset="1"></stop>
                        <stop id="SvgjsStop1715" stop-opacity="0.5" stop-color="rgba(190,209,230,0.5)" offset="1"></stop>
                      </linearGradient>
                      <clipPath id="gridRectMaskbeswf8b2">
                        <rect
                          id="SvgjsRect1717"
                          width="199.14006805419922"
                          height="130.73"
                          x="0"
                          y="0"
                          rx="0"
                          ry="0"
                          opacity="1"
                          stroke-width="0"
                          stroke="none"
                          stroke-dasharray="0"
                          fill="#fff"
                        ></rect>
                      </clipPath>
                      <clipPath id="gridRectBarMaskbeswf8b2">
                        <rect
                          id="SvgjsRect1718"
                          width="207.14006805419922"
                          height="138.73"
                          x="-4"
                          y="-4"
                          rx="0"
                          ry="0"
                          opacity="1"
                          stroke-width="0"
                          stroke="none"
                          stroke-dasharray="0"
                          fill="#fff"
                        ></rect>
                      </clipPath>
                      <clipPath id="gridRectMarkerMaskbeswf8b2">
                        <rect
                          id="SvgjsRect1719"
                          width="199.14006805419922"
                          height="130.73"
                          x="0"
                          y="0"
                          rx="0"
                          ry="0"
                          opacity="1"
                          stroke-width="0"
                          stroke="none"
                          stroke-dasharray="0"
                          fill="#fff"
                        ></rect>
                      </clipPath>
                      <clipPath id="forecastMaskbeswf8b2"></clipPath>
                      <clipPath id="nonForecastMaskbeswf8b2"></clipPath>
                    </defs>
                    <rect
                      id="SvgjsRect1716"
                      width="12.94410442352295"
                      height="130.73"
                      x="0"
                      y="0"
                      rx="0"
                      ry="0"
                      opacity="1"
                      stroke-width="0"
                      stroke-dasharray="3"
                      fill="url(#SvgjsLinearGradient1712)"
                      class="apexcharts-xcrosshairs"
                      y2="130.73"
                      filter="none"
                      fill-opacity="0.9"
                    ></rect>
                    <g id="SvgjsG1739" class="apexcharts-grid">
                      <g id="SvgjsG1740" class="apexcharts-gridlines-horizontal">
                        <line
                          id="SvgjsLine1744"
                          x1="0"
                          y1="32.6825"
                          x2="199.14006805419922"
                          y2="32.6825"
                          stroke="#e0e0e0"
                          stroke-dasharray="0"
                          stroke-linecap="butt"
                          class="apexcharts-gridline"
                        ></line>
                        <line id="SvgjsLine1745" x1="0" y1="65.365" x2="199.14006805419922" y2="65.365" stroke="#e0e0e0" stroke-dasharray="0" stroke-linecap="butt" class="apexcharts-gridline"></line>
                        <line
                          id="SvgjsLine1746"
                          x1="0"
                          y1="98.04749999999999"
                          x2="199.14006805419922"
                          y2="98.04749999999999"
                          stroke="#e0e0e0"
                          stroke-dasharray="0"
                          stroke-linecap="butt"
                          class="apexcharts-gridline"
                        ></line>
                      </g>
                      <g id="SvgjsG1741" class="apexcharts-gridlines-vertical"></g>
                      <line id="SvgjsLine1749" x1="0" y1="130.73" x2="199.14006805419922" y2="130.73" stroke="transparent" stroke-dasharray="0" stroke-linecap="butt"></line>
                      <line id="SvgjsLine1748" x1="0" y1="1" x2="0" y2="130.73" stroke="transparent" stroke-dasharray="0" stroke-linecap="butt"></line>
                    </g>
                    <g id="SvgjsG1742" class="apexcharts-grid-borders">
                      <line id="SvgjsLine1743" x1="0" y1="0" x2="199.14006805419922" y2="0" stroke="#e0e0e0" stroke-dasharray="0" stroke-linecap="butt" class="apexcharts-gridline"></line>
                      <line id="SvgjsLine1747" x1="0" y1="130.73" x2="199.14006805419922" y2="130.73" stroke="#e0e0e0" stroke-dasharray="0" stroke-linecap="butt" class="apexcharts-gridline"></line>
                    </g>
                    <g id="SvgjsG1722" class="apexcharts-bar-series apexcharts-plot-series">
                      <g id="SvgjsG1723" class="apexcharts-series" rel="1" seriesName="Sales" data:realIndex="0">
                        <path
                          id="SvgjsPath1728"
                          d="M 12.122953459421794 128.731 L 12.122953459421794 82.8244 C 12.122953459421794 80.3244 14.622953459421794 77.8244 17.122953459421794 77.8244 L 17.122953459421794 77.8244 C 19.09500567118327 77.8244 21.067057882944745 80.3244 21.067057882944745 82.8244 L 21.067057882944745 128.731 z "
                          fill="rgba(70,95,255,1)"
                          fill-opacity="1"
                          stroke="transparent"
                          stroke-opacity="1"
                          stroke-linecap="round"
                          stroke-width="4"
                          stroke-dasharray="0"
                          class="apexcharts-bar-area"
                          index="0"
                          clip-path="url(#gridRectBarMaskbeswf8b2)"
                          pathTo="M 12.122953459421794 128.731 L 12.122953459421794 82.8244 C 12.122953459421794 80.3244 14.622953459421794 77.8244 17.122953459421794 77.8244 L 17.122953459421794 77.8244 C 19.09500567118327 77.8244 21.067057882944745 80.3244 21.067057882944745 82.8244 L 21.067057882944745 128.731 z "
                          pathFrom="M 12.122953459421794 128.731 L 12.122953459421794 128.731 L 21.067057882944745 128.731 L 21.067057882944745 128.731 L 21.067057882944745 128.731 L 21.067057882944745 128.731 L 21.067057882944745 128.731 L 12.122953459421794 128.731 z"
                          cy="75.82339999999999"
                          cx="41.31296480178833"
                          j="0"
                          val="168"
                          barHeight="54.9066"
                          barWidth="12.94410442352295"
                        ></path>
                        <path
                          id="SvgjsPath1730"
                          d="M 45.31296480178833 128.731 L 45.31296480178833 11.903374999999992 C 45.31296480178833 9.403374999999992 47.81296480178833 6.903374999999992 50.31296480178833 6.903374999999992 L 50.31296480178833 6.903374999999992 C 52.285017013549805 6.903374999999992 54.257069225311284 9.403374999999992 54.257069225311284 11.903374999999992 L 54.257069225311284 128.731 z "
                          fill="rgba(70,95,255,1)"
                          fill-opacity="1"
                          stroke="transparent"
                          stroke-opacity="1"
                          stroke-linecap="round"
                          stroke-width="4"
                          stroke-dasharray="0"
                          class="apexcharts-bar-area"
                          index="0"
                          clip-path="url(#gridRectBarMaskbeswf8b2)"
                          pathTo="M 45.31296480178833 128.731 L 45.31296480178833 11.903374999999992 C 45.31296480178833 9.403374999999992 47.81296480178833 6.903374999999992 50.31296480178833 6.903374999999992 L 50.31296480178833 6.903374999999992 C 52.285017013549805 6.903374999999992 54.257069225311284 9.403374999999992 54.257069225311284 11.903374999999992 L 54.257069225311284 128.731 z "
                          pathFrom="M 45.31296480178833 128.731 L 45.31296480178833 128.731 L 54.257069225311284 128.731 L 54.257069225311284 128.731 L 54.257069225311284 128.731 L 54.257069225311284 128.731 L 54.257069225311284 128.731 L 45.31296480178833 128.731 z"
                          cy="4.902374999999992"
                          cx="74.50297614415487"
                          j="1"
                          val="385"
                          barHeight="125.827625"
                          barWidth="12.94410442352295"
                        ></path>
                        <path
                          id="SvgjsPath1732"
                          d="M 78.50297614415487 128.731 L 78.50297614415487 72.039175 C 78.50297614415487 69.539175 81.00297614415487 67.039175 83.50297614415487 67.039175 L 83.50297614415487 67.039175 C 85.47502835591635 67.039175 87.44708056767782 69.539175 87.44708056767782 72.039175 L 87.44708056767782 128.731 z "
                          fill="rgba(70,95,255,1)"
                          fill-opacity="1"
                          stroke="transparent"
                          stroke-opacity="1"
                          stroke-linecap="round"
                          stroke-width="4"
                          stroke-dasharray="0"
                          class="apexcharts-bar-area"
                          index="0"
                          clip-path="url(#gridRectBarMaskbeswf8b2)"
                          pathTo="M 78.50297614415487 128.731 L 78.50297614415487 72.039175 C 78.50297614415487 69.539175 81.00297614415487 67.039175 83.50297614415487 67.039175 L 83.50297614415487 67.039175 C 85.47502835591635 67.039175 87.44708056767782 69.539175 87.44708056767782 72.039175 L 87.44708056767782 128.731 z "
                          pathFrom="M 78.50297614415487 128.731 L 78.50297614415487 128.731 L 87.44708056767782 128.731 L 87.44708056767782 128.731 L 87.44708056767782 128.731 L 87.44708056767782 128.731 L 87.44708056767782 128.731 L 78.50297614415487 128.731 z"
                          cy="65.038175"
                          cx="107.69298748652142"
                          j="2"
                          val="201"
                          barHeight="65.691825"
                          barWidth="12.94410442352295"
                        ></path>
                        <path
                          id="SvgjsPath1734"
                          d="M 111.69298748652142 128.731 L 111.69298748652142 40.33714999999999 C 111.69298748652142 37.83714999999999 114.19298748652142 35.33714999999999 116.69298748652142 35.33714999999999 L 116.69298748652142 35.33714999999999 C 118.6650396982829 35.33714999999999 120.63709191004436 37.83714999999999 120.63709191004436 40.33714999999999 L 120.63709191004436 128.731 z "
                          fill="rgba(70,95,255,1)"
                          fill-opacity="1"
                          stroke="transparent"
                          stroke-opacity="1"
                          stroke-linecap="round"
                          stroke-width="4"
                          stroke-dasharray="0"
                          class="apexcharts-bar-area"
                          index="0"
                          clip-path="url(#gridRectBarMaskbeswf8b2)"
                          pathTo="M 111.69298748652142 128.731 L 111.69298748652142 40.33714999999999 C 111.69298748652142 37.83714999999999 114.19298748652142 35.33714999999999 116.69298748652142 35.33714999999999 L 116.69298748652142 35.33714999999999 C 118.6650396982829 35.33714999999999 120.63709191004436 37.83714999999999 120.63709191004436 40.33714999999999 L 120.63709191004436 128.731 z "
                          pathFrom="M 111.69298748652142 128.731 L 111.69298748652142 128.731 L 120.63709191004436 128.731 L 120.63709191004436 128.731 L 120.63709191004436 128.731 L 120.63709191004436 128.731 L 120.63709191004436 128.731 L 111.69298748652142 128.731 z"
                          cy="33.33614999999999"
                          cx="140.88299882888796"
                          j="3"
                          val="298"
                          barHeight="97.39385"
                          barWidth="12.94410442352295"
                        ></path>
                        <path
                          id="SvgjsPath1736"
                          d="M 144.88299882888796 128.731 L 144.88299882888796 76.61472499999999 C 144.88299882888796 74.11472499999999 147.38299882888796 71.61472499999999 149.88299882888796 71.61472499999999 L 149.88299882888796 71.61472499999999 C 151.85505104064944 71.61472499999999 153.82710325241092 74.11472499999999 153.82710325241092 76.61472499999999 L 153.82710325241092 128.731 z "
                          fill="rgba(70,95,255,1)"
                          fill-opacity="1"
                          stroke="transparent"
                          stroke-opacity="1"
                          stroke-linecap="round"
                          stroke-width="4"
                          stroke-dasharray="0"
                          class="apexcharts-bar-area"
                          index="0"
                          clip-path="url(#gridRectBarMaskbeswf8b2)"
                          pathTo="M 144.88299882888796 128.731 L 144.88299882888796 76.61472499999999 C 144.88299882888796 74.11472499999999 147.38299882888796 71.61472499999999 149.88299882888796 71.61472499999999 L 149.88299882888796 71.61472499999999 C 151.85505104064944 71.61472499999999 153.82710325241092 74.11472499999999 153.82710325241092 76.61472499999999 L 153.82710325241092 128.731 z "
                          pathFrom="M 144.88299882888796 128.731 L 144.88299882888796 128.731 L 153.82710325241092 128.731 L 153.82710325241092 128.731 L 153.82710325241092 128.731 L 153.82710325241092 128.731 L 153.82710325241092 128.731 L 144.88299882888796 128.731 z"
                          cy="69.61372499999999"
                          cx="174.0730101712545"
                          j="4"
                          val="187"
                          barHeight="61.116275"
                          barWidth="12.94410442352295"
                        ></path>
                        <path
                          id="SvgjsPath1738"
                          d="M 178.0730101712545 128.731 L 178.0730101712545 74.000125 C 178.0730101712545 71.500125 180.5730101712545 69.000125 183.0730101712545 69.000125 L 183.0730101712545 69.000125 C 185.045062383016 69.000125 187.01711459477747 71.500125 187.01711459477747 74.000125 L 187.01711459477747 128.731 z "
                          fill="rgba(70,95,255,1)"
                          fill-opacity="1"
                          stroke="transparent"
                          stroke-opacity="1"
                          stroke-linecap="round"
                          stroke-width="4"
                          stroke-dasharray="0"
                          class="apexcharts-bar-area"
                          index="0"
                          clip-path="url(#gridRectBarMaskbeswf8b2)"
                          pathTo="M 178.0730101712545 128.731 L 178.0730101712545 74.000125 C 178.0730101712545 71.500125 180.5730101712545 69.000125 183.0730101712545 69.000125 L 183.0730101712545 69.000125 C 185.045062383016 69.000125 187.01711459477747 71.500125 187.01711459477747 74.000125 L 187.01711459477747 128.731 z "
                          pathFrom="M 178.0730101712545 128.731 L 178.0730101712545 128.731 L 187.01711459477747 128.731 L 187.01711459477747 128.731 L 187.01711459477747 128.731 L 187.01711459477747 128.731 L 187.01711459477747 128.731 L 178.0730101712545 128.731 z"
                          cy="66.99912499999999"
                          cx="207.26302151362106"
                          j="5"
                          val="195"
                          barHeight="63.730875"
                          barWidth="12.94410442352295"
                        ></path>
                        <g id="SvgjsG1725" class="apexcharts-bar-goals-markers">
                          <g id="SvgjsG1727" className="apexcharts-bar-goals-groups" class="apexcharts-hidden-element-shown" clip-path="url(#gridRectMarkerMaskbeswf8b2)"></g>
                          <g id="SvgjsG1729" className="apexcharts-bar-goals-groups" class="apexcharts-hidden-element-shown" clip-path="url(#gridRectMarkerMaskbeswf8b2)"></g>
                          <g id="SvgjsG1731" className="apexcharts-bar-goals-groups" class="apexcharts-hidden-element-shown" clip-path="url(#gridRectMarkerMaskbeswf8b2)"></g>
                          <g id="SvgjsG1733" className="apexcharts-bar-goals-groups" class="apexcharts-hidden-element-shown" clip-path="url(#gridRectMarkerMaskbeswf8b2)"></g>
                          <g id="SvgjsG1735" className="apexcharts-bar-goals-groups" class="apexcharts-hidden-element-shown" clip-path="url(#gridRectMarkerMaskbeswf8b2)"></g>
                          <g id="SvgjsG1737" className="apexcharts-bar-goals-groups" class="apexcharts-hidden-element-shown" clip-path="url(#gridRectMarkerMaskbeswf8b2)"></g>
                        </g>
                        <g id="SvgjsG1726" class="apexcharts-bar-shadows apexcharts-hidden-element-shown"></g>
                      </g>
                      <g id="SvgjsG1724" class="apexcharts-datalabels apexcharts-hidden-element-shown" data:realIndex="0"></g>
                    </g>
                    <line
                      id="SvgjsLine1750"
                      x1="0"
                      y1="0"
                      x2="199.14006805419922"
                      y2="0"
                      stroke="#b6b6b6"
                      stroke-dasharray="0"
                      stroke-width="1"
                      stroke-linecap="butt"
                      class="apexcharts-ycrosshairs"
                    ></line>
                    <line id="SvgjsLine1751" x1="0" y1="0" x2="199.14006805419922" y2="0" stroke-dasharray="0" stroke-width="0" stroke-linecap="butt" class="apexcharts-ycrosshairs-hidden"></line>
                    <g id="SvgjsG1752" class="apexcharts-xaxis" transform="translate(0, 0)">
                      <g id="SvgjsG1753" class="apexcharts-xaxis-texts-g" transform="translate(0, -4)">
                        <text
                          id="SvgjsText1755"
                          font-family="Outfit, sans-serif"
                          x="16.59500567118327"
                          y="158.73"
                          text-anchor="middle"
                          dominant-baseline="auto"
                          font-size="12px"
                          font-weight="400"
                          fill="#373d3f"
                          class="apexcharts-text apexcharts-xaxis-label"
                          style="font-family: Outfit, sans-serif"
                        >
                          <tspan id="SvgjsTspan1756">Jan</tspan>
                          <title>Jan</title>
                        </text>
                        <text
                          id="SvgjsText1758"
                          font-family="Outfit, sans-serif"
                          x="49.785017013549805"
                          y="158.73"
                          text-anchor="middle"
                          dominant-baseline="auto"
                          font-size="12px"
                          font-weight="400"
                          fill="#373d3f"
                          class="apexcharts-text apexcharts-xaxis-label"
                          style="font-family: Outfit, sans-serif"
                        >
                          <tspan id="SvgjsTspan1759">Feb</tspan>
                          <title>Feb</title>
                        </text>
                        <text
                          id="SvgjsText1761"
                          font-family="Outfit, sans-serif"
                          x="82.97502835591634"
                          y="158.73"
                          text-anchor="middle"
                          dominant-baseline="auto"
                          font-size="12px"
                          font-weight="400"
                          fill="#373d3f"
                          class="apexcharts-text apexcharts-xaxis-label"
                          style="font-family: Outfit, sans-serif"
                        >
                          <tspan id="SvgjsTspan1762">Mar</tspan>
                          <title>Mar</title>
                        </text>
                        <text
                          id="SvgjsText1764"
                          font-family="Outfit, sans-serif"
                          x="116.16503969828288"
                          y="158.73"
                          text-anchor="middle"
                          dominant-baseline="auto"
                          font-size="12px"
                          font-weight="400"
                          fill="#373d3f"
                          class="apexcharts-text apexcharts-xaxis-label"
                          style="font-family: Outfit, sans-serif"
                        >
                          <tspan id="SvgjsTspan1765">Apr</tspan>
                          <title>Apr</title>
                        </text>
                        <text
                          id="SvgjsText1767"
                          font-family="Outfit, sans-serif"
                          x="149.35505104064944"
                          y="158.73"
                          text-anchor="middle"
                          dominant-baseline="auto"
                          font-size="12px"
                          font-weight="400"
                          fill="#373d3f"
                          class="apexcharts-text apexcharts-xaxis-label"
                          style="font-family: Outfit, sans-serif"
                        >
                          <tspan id="SvgjsTspan1768">May</tspan>
                          <title>May</title>
                        </text>
                        <text
                          id="SvgjsText1770"
                          font-family="Outfit, sans-serif"
                          x="182.545062383016"
                          y="158.73"
                          text-anchor="middle"
                          dominant-baseline="auto"
                          font-size="12px"
                          font-weight="400"
                          fill="#373d3f"
                          class="apexcharts-text apexcharts-xaxis-label"
                          style="font-family: Outfit, sans-serif"
                        >
                          <tspan id="SvgjsTspan1771">Jun</tspan>
                          <title>Jun</title>
                        </text>
                      </g>
                    </g>
                    <g id="SvgjsG1789" class="apexcharts-yaxis-annotations"></g>
                    <g id="SvgjsG1790" class="apexcharts-xaxis-annotations"></g>
                    <g id="SvgjsG1791" class="apexcharts-point-annotations"></g>
                  </g>
                </svg>
                <div class="apexcharts-tooltip apexcharts-theme-light">
                  <div class="apexcharts-tooltip-series-group apexcharts-tooltip-series-group-0" style="order: 1">
                    <span class="apexcharts-tooltip-marker" style="background-color: rgb(70, 95, 255)"></span>
                    <div class="apexcharts-tooltip-text" style="font-family: Outfit, sans-serif; font-size: 12px">
                      <div class="apexcharts-tooltip-y-group">
                        <span class="apexcharts-tooltip-text-y-label"></span>
                        <span class="apexcharts-tooltip-text-y-value"></span>
                      </div>
                      <div class="apexcharts-tooltip-goals-group">
                        <span class="apexcharts-tooltip-text-goals-label"></span>
                        <span class="apexcharts-tooltip-text-goals-value"></span>
                      </div>
                      <div class="apexcharts-tooltip-z-group">
                        <span class="apexcharts-tooltip-text-z-label"></span>
                        <span class="apexcharts-tooltip-text-z-value"></span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="apexcharts-yaxistooltip apexcharts-yaxistooltip-0 apexcharts-yaxistooltip-left apexcharts-theme-light">
                  <div class="apexcharts-yaxistooltip-text"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- ====== Chart Fifteen End -->

        <!-- ====== Chart Fifteen Start -->
        <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="mb-6 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">My Watchlist</h3>

            <div x-data="{openDropDown: false}" class="relative">
              <button
                @click="openDropDown = !openDropDown"
                :class="openDropDown ? 'text-gray-700 dark:text-white' : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'"
                class="text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M10.2441 6C10.2441 5.0335 11.0276 4.25 11.9941 4.25H12.0041C12.9706 4.25 13.7541 5.0335 13.7541 6C13.7541 6.9665 12.9706 7.75 12.0041 7.75H11.9941C11.0276 7.75 10.2441 6.9665 10.2441 6ZM10.2441 18C10.2441 17.0335 11.0276 16.25 11.9941 16.25H12.0041C12.9706 16.25 13.7541 17.0335 13.7541 18C13.7541 18.9665 12.9706 19.75 12.0041 19.75H11.9941C11.0276 19.75 10.2441 18.9665 10.2441 18ZM11.9941 10.25C11.0276 10.25 10.2441 11.0335 10.2441 12C10.2441 12.9665 11.0276 13.75 11.9941 13.75H12.0041C12.9706 13.75 13.7541 12.9665 13.7541 12C13.7541 11.0335 12.9706 10.25 12.0041 10.25H11.9941Z"
                    fill=""
                  ></path>
                </svg>
              </button>
              <div
                x-show="openDropDown"
                @click.outside="openDropDown = false"
                class="absolute right-0 top-full z-40 w-40 space-y-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
                style="display: none"
              >
                <button
                  class="flex w-full rounded-lg px-3 py-2 text-left text-theme-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                >
                  View More
                </button>
                <button
                  class="flex w-full rounded-lg px-3 py-2 text-left text-theme-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <div class="flex h-[372px] flex-col">
            <div class="custom-scrollbar flex h-auto flex-col overflow-y-auto pr-3">
              <!-- Watchlist item -->
              <div class="flex items-center justify-between border-b border-gray-200 pb-4 pt-4 first:pt-0 last:border-b-0 last:pb-0 dark:border-gray-800">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10">
                    <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg" alt="brand" />
                  </div>

                  <div>
                    <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">AAPL</h3>
                    <span class="block text-theme-xs text-gray-500 dark:text-gray-400">Apple, Inc</span>
                  </div>
                </div>

                <div>
                  <div>
                    <h4 class="mb-1 text-right text-theme-sm font-medium text-gray-700 dark:text-gray-400">$4,008.65</h4>
                  </div>

                  <span class="flex items-center justify-end gap-1 text-theme-xs font-medium text-success-600 dark:text-success-500">
                    <svg class="fill-current" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M5.56462 1.62394C5.70193 1.47073 5.90135 1.37433 6.12329 1.37433C6.1236 1.37433 6.12391 1.37433 6.12422 1.37433C6.31631 1.37416 6.50845 1.44732 6.65505 1.59381L9.65514 4.59181C9.94814 4.8846 9.94831 5.35947 9.65552 5.65247C9.36273 5.94546 8.88785 5.94563 8.59486 5.65284L6.87329 3.93248L6.87329 10.125C6.87329 10.5392 6.53751 10.875 6.12329 10.875C5.70908 10.875 5.37329 10.5392 5.37329 10.125L5.37329 3.93579L3.65516 5.65282C3.36218 5.94562 2.8873 5.94547 2.5945 5.65249C2.3017 5.3595 2.30185 4.88463 2.59484 4.59183L5.56462 1.62394Z"
                        fill=""
                      ></path>
                    </svg>

                    11.01%
                  </span>
                </div>
              </div>

              <!-- Watchlist item -->
              <div class="flex items-center justify-between border-b border-gray-200 pb-4 pt-4 first:pt-0 last:border-b-0 last:pb-0 dark:border-gray-800">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10">
                    <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg" alt="brand" />
                  </div>

                  <div>
                    <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">SPOT</h3>
                    <span class="block text-theme-xs text-gray-500 dark:text-gray-400">Spotify.com</span>
                  </div>
                </div>

                <div>
                  <div>
                    <h4 class="mb-1 text-right text-theme-sm font-medium text-gray-700 dark:text-gray-400">$11,689.00</h4>
                  </div>

                  <span class="flex items-center justify-end gap-1 text-theme-xs font-medium text-success-600 dark:text-success-500">
                    <svg class="fill-current" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M5.56462 1.62394C5.70193 1.47073 5.90135 1.37433 6.12329 1.37433C6.1236 1.37433 6.12391 1.37433 6.12422 1.37433C6.31631 1.37416 6.50845 1.44732 6.65505 1.59381L9.65514 4.59181C9.94814 4.8846 9.94831 5.35947 9.65552 5.65247C9.36273 5.94546 8.88785 5.94563 8.59486 5.65284L6.87329 3.93248L6.87329 10.125C6.87329 10.5392 6.53751 10.875 6.12329 10.875C5.70908 10.875 5.37329 10.5392 5.37329 10.125L5.37329 3.93579L3.65516 5.65282C3.36218 5.94562 2.8873 5.94547 2.5945 5.65249C2.3017 5.3595 2.30185 4.88463 2.59484 4.59183L5.56462 1.62394Z"
                        fill=""
                      ></path>
                    </svg>

                    9.48%
                  </span>
                </div>
              </div>

              <!-- Watchlist item -->
              <div class="flex items-center justify-between border-b border-gray-200 pb-4 pt-4 first:pt-0 last:border-b-0 last:pb-0 dark:border-gray-800">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10">
                    <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg" alt="brand" />
                  </div>

                  <div>
                    <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">ABNB</h3>
                    <span class="block text-theme-xs text-gray-500 dark:text-gray-400">Airbnb, Inc</span>
                  </div>
                </div>

                <div>
                  <div>
                    <h4 class="mb-1 text-right text-theme-sm font-medium text-gray-700 dark:text-gray-400">$32,227.00</h4>
                  </div>

                  <span class="flex items-center justify-end gap-1 text-theme-xs font-medium text-error-600 dark:text-error-500">
                    <svg class="fill-current" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M5.31462 10.3761C5.45194 10.5293 5.65136 10.6257 5.87329 10.6257C5.8736 10.6257 5.8739 10.6257 5.87421 10.6257C6.0663 10.6259 6.25845 10.5527 6.40505 10.4062L9.40514 7.4082C9.69814 7.11541 9.69831 6.64054 9.40552 6.34754C9.11273 6.05454 8.63785 6.05438 8.34486 6.34717L6.62329 8.06753L6.62329 1.875C6.62329 1.46079 6.28751 1.125 5.87329 1.125C5.45908 1.125 5.12329 1.46079 5.12329 1.875L5.12329 8.06422L3.40516 6.34719C3.11218 6.05439 2.6373 6.05454 2.3445 6.34752C2.0517 6.64051 2.05185 7.11538 2.34484 7.40818L5.31462 10.3761Z"
                        fill=""
                      ></path>
                    </svg>

                    0.29%
                  </span>
                </div>
              </div>

              <!-- Watchlist item -->
              <div class="flex items-center justify-between border-b border-gray-200 pb-4 pt-4 first:pt-0 last:border-b-0 last:pb-0 dark:border-gray-800">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10">
                    <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg" alt="brand" />
                  </div>

                  <div>
                    <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">ENVT</h3>
                    <span class="block text-theme-xs text-gray-500 dark:text-gray-400">Envato, Inc</span>
                  </div>
                </div>

                <div>
                  <div>
                    <h4 class="mb-1 text-right text-theme-sm font-medium text-gray-700 dark:text-gray-400">$13,895.00</h4>
                  </div>

                  <span class="flex items-center justify-end gap-1 text-theme-xs font-medium text-success-600 dark:text-success-500">
                    <svg class="fill-current" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M5.56462 1.62394C5.70193 1.47073 5.90135 1.37433 6.12329 1.37433C6.1236 1.37433 6.12391 1.37433 6.12422 1.37433C6.31631 1.37416 6.50845 1.44732 6.65505 1.59381L9.65514 4.59181C9.94814 4.8846 9.94831 5.35947 9.65552 5.65247C9.36273 5.94546 8.88785 5.94563 8.59486 5.65284L6.87329 3.93248L6.87329 10.125C6.87329 10.5392 6.53751 10.875 6.12329 10.875C5.70908 10.875 5.37329 10.5392 5.37329 10.125L5.37329 3.93579L3.65516 5.65282C3.36218 5.94562 2.8873 5.94547 2.5945 5.65249C2.3017 5.3595 2.30185 4.88463 2.59484 4.59183L5.56462 1.62394Z"
                        fill=""
                      ></path>
                    </svg>

                    3.79%
                  </span>
                </div>
              </div>

              <!-- Watchlist item -->
              <div class="flex items-center justify-between border-b border-gray-200 pb-4 pt-4 first:pt-0 last:border-b-0 last:pb-0 dark:border-gray-800">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10">
                    <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg" alt="brand" />
                  </div>

                  <div>
                    <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">QIWI</h3>
                    <span class="block text-theme-xs text-gray-500 dark:text-gray-400">qiwi.com, Inc</span>
                  </div>
                </div>

                <div>
                  <div>
                    <h4 class="mb-1 text-right text-theme-sm font-medium text-gray-700 dark:text-gray-400">$4,008.65</h4>
                  </div>

                  <span class="flex items-center justify-end gap-1 text-theme-xs font-medium text-success-600 dark:text-success-500">
                    <svg class="fill-current" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M5.56462 1.62394C5.70193 1.47073 5.90135 1.37433 6.12329 1.37433C6.1236 1.37433 6.12391 1.37433 6.12422 1.37433C6.31631 1.37416 6.50845 1.44732 6.65505 1.59381L9.65514 4.59181C9.94814 4.8846 9.94831 5.35947 9.65552 5.65247C9.36273 5.94546 8.88785 5.94563 8.59486 5.65284L6.87329 3.93248L6.87329 10.125C6.87329 10.5392 6.53751 10.875 6.12329 10.875C5.70908 10.875 5.37329 10.5392 5.37329 10.125L5.37329 3.93579L3.65516 5.65282C3.36218 5.94562 2.8873 5.94547 2.5945 5.65249C2.3017 5.3595 2.30185 4.88463 2.59484 4.59183L5.56462 1.62394Z"
                        fill=""
                      ></path>
                    </svg>

                    4.52%
                  </span>
                </div>
              </div>

              <!-- Watchlist item -->
              <div class="flex items-center justify-between border-b border-gray-200 pb-4 pt-4 first:pt-0 last:border-b-0 last:pb-0 dark:border-gray-800">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10">
                    <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg" alt="brand" />
                  </div>

                  <div>
                    <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">AAPL</h3>
                    <span class="block text-theme-xs text-gray-500 dark:text-gray-400">Apple, Inc</span>
                  </div>
                </div>

                <div>
                  <div>
                    <h4 class="mb-1 text-right text-theme-sm font-medium text-gray-700 dark:text-gray-400">$4,008.65</h4>
                  </div>

                  <span class="flex items-center justify-end gap-1 text-theme-xs font-medium text-success-600 dark:text-success-500">
                    <svg class="fill-current" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M5.56462 1.62394C5.70193 1.47073 5.90135 1.37433 6.12329 1.37433C6.1236 1.37433 6.12391 1.37433 6.12422 1.37433C6.31631 1.37416 6.50845 1.44732 6.65505 1.59381L9.65514 4.59181C9.94814 4.8846 9.94831 5.35947 9.65552 5.65247C9.36273 5.94546 8.88785 5.94563 8.59486 5.65284L6.87329 3.93248L6.87329 10.125C6.87329 10.5392 6.53751 10.875 6.12329 10.875C5.70908 10.875 5.37329 10.5392 5.37329 10.125L5.37329 3.93579L3.65516 5.65282C3.36218 5.94562 2.8873 5.94547 2.5945 5.65249C2.3017 5.3595 2.30185 4.88463 2.59484 4.59183L5.56462 1.62394Z"
                        fill=""
                      ></path>
                    </svg>

                    11.01%
                  </span>
                </div>
              </div>

              <!-- Watchlist item -->
              <div class="flex items-center justify-between border-b border-gray-200 pb-4 pt-4 first:pt-0 last:border-b-0 last:pb-0 dark:border-gray-800">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10">
                    <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg" alt="brand" />
                  </div>

                  <div>
                    <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">SPOT</h3>
                    <span class="block text-theme-xs text-gray-500 dark:text-gray-400">Spotify.com</span>
                  </div>
                </div>

                <div>
                  <div>
                    <h4 class="mb-1 text-right text-theme-sm font-medium text-gray-700 dark:text-gray-400">$11,689.00</h4>
                  </div>

                  <span class="flex items-center justify-end gap-1 text-theme-xs font-medium text-success-600 dark:text-success-500">
                    <svg class="fill-current" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M5.56462 1.62394C5.70193 1.47073 5.90135 1.37433 6.12329 1.37433C6.1236 1.37433 6.12391 1.37433 6.12422 1.37433C6.31631 1.37416 6.50845 1.44732 6.65505 1.59381L9.65514 4.59181C9.94814 4.8846 9.94831 5.35947 9.65552 5.65247C9.36273 5.94546 8.88785 5.94563 8.59486 5.65284L6.87329 3.93248L6.87329 10.125C6.87329 10.5392 6.53751 10.875 6.12329 10.875C5.70908 10.875 5.37329 10.5392 5.37329 10.125L5.37329 3.93579L3.65516 5.65282C3.36218 5.94562 2.8873 5.94547 2.5945 5.65249C2.3017 5.3595 2.30185 4.88463 2.59484 4.59183L5.56462 1.62394Z"
                        fill=""
                      ></path>
                    </svg>

                    9.48%
                  </span>
                </div>
              </div>

              <!-- Watchlist item -->
              <div class="flex items-center justify-between border-b border-gray-200 pb-4 pt-4 first:pt-0 last:border-b-0 last:pb-0 dark:border-gray-800">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10">
                    <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg" alt="brand" />
                  </div>

                  <div>
                    <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">ABNB</h3>
                    <span class="block text-theme-xs text-gray-500 dark:text-gray-400">Airbnb, Inc</span>
                  </div>
                </div>

                <div>
                  <div>
                    <h4 class="mb-1 text-right text-theme-sm font-medium text-gray-700 dark:text-gray-400">$32,227.00</h4>
                  </div>

                  <span class="flex items-center justify-end gap-1 text-theme-xs font-medium text-error-600 dark:text-error-500">
                    <svg class="fill-current" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M5.31462 10.3761C5.45194 10.5293 5.65136 10.6257 5.87329 10.6257C5.8736 10.6257 5.8739 10.6257 5.87421 10.6257C6.0663 10.6259 6.25845 10.5527 6.40505 10.4062L9.40514 7.4082C9.69814 7.11541 9.69831 6.64054 9.40552 6.34754C9.11273 6.05454 8.63785 6.05438 8.34486 6.34717L6.62329 8.06753L6.62329 1.875C6.62329 1.46079 6.28751 1.125 5.87329 1.125C5.45908 1.125 5.12329 1.46079 5.12329 1.875L5.12329 8.06422L3.40516 6.34719C3.11218 6.05439 2.6373 6.05454 2.3445 6.34752C2.0517 6.64051 2.05185 7.11538 2.34484 7.40818L5.31462 10.3761Z"
                        fill=""
                      ></path>
                    </svg>

                    0.29%
                  </span>
                </div>
              </div>

              <!-- Watchlist item -->
              <div class="flex items-center justify-between border-b border-gray-200 pb-4 pt-4 first:pt-0 last:border-b-0 last:pb-0 dark:border-gray-800">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10">
                    <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg" alt="brand" />
                  </div>

                  <div>
                    <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">ENVT</h3>
                    <span class="block text-theme-xs text-gray-500 dark:text-gray-400">Envato, Inc</span>
                  </div>
                </div>

                <div>
                  <div>
                    <h4 class="mb-1 text-right text-theme-sm font-medium text-gray-600 dark:text-gray-400">$13,895.00</h4>
                  </div>

                  <span class="flex items-center justify-end gap-1 text-theme-xs font-medium text-success-700 dark:text-success-500">
                    <svg class="fill-current" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M5.56462 1.62394C5.70193 1.47073 5.90135 1.37433 6.12329 1.37433C6.1236 1.37433 6.12391 1.37433 6.12422 1.37433C6.31631 1.37416 6.50845 1.44732 6.65505 1.59381L9.65514 4.59181C9.94814 4.8846 9.94831 5.35947 9.65552 5.65247C9.36273 5.94546 8.88785 5.94563 8.59486 5.65284L6.87329 3.93248L6.87329 10.125C6.87329 10.5392 6.53751 10.875 6.12329 10.875C5.70908 10.875 5.37329 10.5392 5.37329 10.125L5.37329 3.93579L3.65516 5.65282C3.36218 5.94562 2.8873 5.94547 2.5945 5.65249C2.3017 5.3595 2.30185 4.88463 2.59484 4.59183L5.56462 1.62394Z"
                        fill=""
                      ></path>
                    </svg>

                    3.79%
                  </span>
                </div>
              </div>

              <!-- Watchlist item -->
              <div class="flex items-center justify-between border-b border-gray-200 pb-4 pt-4 first:pt-0 last:border-b-0 last:pb-0 dark:border-gray-800">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10">
                    <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg" alt="brand" />
                  </div>

                  <div>
                    <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">QIWI</h3>
                    <span class="block text-theme-xs text-gray-500 dark:text-gray-400">qiwi.com, Inc</span>
                  </div>
                </div>

                <div>
                  <div>
                    <h4 class="mb-1 text-right text-theme-sm font-medium text-gray-700 dark:text-gray-400">$4,008.65</h4>
                  </div>

                  <span class="flex items-center justify-end gap-1 text-theme-xs font-medium text-success-600 dark:text-success-500">
                    <svg class="fill-current" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M5.56462 1.62394C5.70193 1.47073 5.90135 1.37433 6.12329 1.37433C6.1236 1.37433 6.12391 1.37433 6.12422 1.37433C6.31631 1.37416 6.50845 1.44732 6.65505 1.59381L9.65514 4.59181C9.94814 4.8846 9.94831 5.35947 9.65552 5.65247C9.36273 5.94546 8.88785 5.94563 8.59486 5.65284L6.87329 3.93248L6.87329 10.125C6.87329 10.5392 6.53751 10.875 6.12329 10.875C5.70908 10.875 5.37329 10.5392 5.37329 10.125L5.37329 3.93579L3.65516 5.65282C3.36218 5.94562 2.8873 5.94547 2.5945 5.65249C2.3017 5.3595 2.30185 4.88463 2.59484 4.59183L5.56462 1.62394Z"
                        fill=""
                      ></path>
                    </svg>

                    4.52%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- ====== Chart Fifteen End -->
      </div>

      <div class="col-span-12">
        <!-- Table Five -->
        <div class="rounded-2xl border border-gray-200 bg-white pt-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="mb-4 flex flex-col gap-2 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Latest Transactions</h3>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <form>
                <div class="relative">
                  <span class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2">
                    <svg class="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M3.04199 9.37381C3.04199 5.87712 5.87735 3.04218 9.37533 3.04218C12.8733 3.04218 15.7087 5.87712 15.7087 9.37381C15.7087 12.8705 12.8733 15.7055 9.37533 15.7055C5.87735 15.7055 3.04199 12.8705 3.04199 9.37381ZM9.37533 1.54218C5.04926 1.54218 1.54199 5.04835 1.54199 9.37381C1.54199 13.6993 5.04926 17.2055 9.37533 17.2055C11.2676 17.2055 13.0032 16.5346 14.3572 15.4178L17.1773 18.2381C17.4702 18.531 17.945 18.5311 18.2379 18.2382C18.5308 17.9453 18.5309 17.4704 18.238 17.1775L15.4182 14.3575C16.5367 13.0035 17.2087 11.2671 17.2087 9.37381C17.2087 5.04835 13.7014 1.54218 9.37533 1.54218Z"
                        fill=""
                      ></path>
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search..."
                    class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-[42px] w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-[42px] text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden xl:w-[300px] dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                  />
                </div>
              </form>
            </div>
          </div>

          <div class="custom-scrollbar max-w-full overflow-x-auto px-5 sm:px-6">
            <table class="min-w-full">
              <thead class="border-y border-gray-100 py-3 dark:border-gray-800">
                <tr>
                  <th class="py-3 font-normal whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-500 dark:text-gray-400">Name</p>
                    </div>
                  </th>
                  <th class="py-3 font-normal whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-500 dark:text-gray-400">Date</p>
                    </div>
                  </th>
                  <th class="py-3 font-normal whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-500 dark:text-gray-400">Price</p>
                    </div>
                  </th>
                  <th class="py-3 font-normal whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-500 dark:text-gray-400">Category</p>
                    </div>
                  </th>
                  <th class="py-3 font-normal whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-500 dark:text-gray-400">Status</p>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr>
                  <td class="py-3 whitespace-nowrap">
                    <div class="col-span-3 flex items-center">
                      <div class="flex items-center gap-3">
                        <div class="h-8 w-8">
                          <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg" alt="brand" />
                        </div>

                        <div>
                          <span class="text-theme-sm block font-medium text-gray-700 dark:text-gray-400">Bought PYPL</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-700 dark:text-gray-400">Nov 23, 01:00 PM</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-700 dark:text-gray-400">$2,567.88</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-700 dark:text-gray-400">Finance</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="bg-success-50 text-theme-xs text-success-600 dark:bg-success-500/15 dark:text-success-500 rounded-full px-2 py-0.5 font-medium">Success</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center justify-center">
                      <div x-data="{openDropDown: false}" class="relative">
                        <button @click="openDropDown = !openDropDown" class="text-gray-500 dark:text-gray-400">
                          <svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M5.99902 10.245C6.96552 10.245 7.74902 11.0285 7.74902 11.995V12.005C7.74902 12.9715 6.96552 13.755 5.99902 13.755C5.03253 13.755 4.24902 12.9715 4.24902 12.005V11.995C4.24902 11.0285 5.03253 10.245 5.99902 10.245ZM17.999 10.245C18.9655 10.245 19.749 11.0285 19.749 11.995V12.005C19.749 12.9715 18.9655 13.755 17.999 13.755C17.0325 13.755 16.249 12.9715 16.249 12.005V11.995C16.249 11.0285 17.0325 10.245 17.999 10.245ZM13.749 11.995C13.749 11.0285 12.9655 10.245 11.999 10.245C11.0325 10.245 10.249 11.0285 10.249 11.995V12.005C10.249 12.9715 11.0325 13.755 11.999 13.755C12.9655 13.755 13.749 12.9715 13.749 12.005V11.995Z"
                              fill=""
                            ></path>
                          </svg>
                        </button>
                        <div
                          x-show="openDropDown"
                          @click.outside="openDropDown = false"
                          class="shadow-theme-lg dark:bg-gray-dark absolute top-full right-0 z-40 w-40 space-y-1 rounded-2xl border border-gray-200 bg-white p-2 dark:border-gray-800"
                          style="display: none"
                        >
                          <button
                            class="text-theme-xs flex w-full rounded-lg px-3 py-2 text-left font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            View More
                          </button>
                          <button
                            class="text-theme-xs flex w-full rounded-lg px-3 py-2 text-left font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex items-center gap-3">
                        <div class="h-8 w-8">
                          <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg" alt="brand" />
                        </div>

                        <div>
                          <span class="text-theme-sm block font-medium text-gray-700 dark:text-gray-400">Bought AAPL</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-700 dark:text-gray-400">Nov 22, 09:00 PM</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-700 dark:text-gray-400">$2,567.88</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-700 dark:text-gray-400">Technology</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="bg-warning-50 text-theme-xs text-warning-600 dark:bg-warning-500/15 dark:text-warning-400 rounded-full px-2 py-0.5 font-medium">Pending</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center justify-center">
                      <div x-data="{openDropDown: false}" class="relative">
                        <button @click="openDropDown = !openDropDown" class="text-gray-500 dark:text-gray-400">
                          <svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M5.99902 10.245C6.96552 10.245 7.74902 11.0285 7.74902 11.995V12.005C7.74902 12.9715 6.96552 13.755 5.99902 13.755C5.03253 13.755 4.24902 12.9715 4.24902 12.005V11.995C4.24902 11.0285 5.03253 10.245 5.99902 10.245ZM17.999 10.245C18.9655 10.245 19.749 11.0285 19.749 11.995V12.005C19.749 12.9715 18.9655 13.755 17.999 13.755C17.0325 13.755 16.249 12.9715 16.249 12.005V11.995C16.249 11.0285 17.0325 10.245 17.999 10.245ZM13.749 11.995C13.749 11.0285 12.9655 10.245 11.999 10.245C11.0325 10.245 10.249 11.0285 10.249 11.995V12.005C10.249 12.9715 11.0325 13.755 11.999 13.755C12.9655 13.755 13.749 12.9715 13.749 12.005V11.995Z"
                              fill=""
                            ></path>
                          </svg>
                        </button>
                        <div
                          x-show="openDropDown"
                          @click.outside="openDropDown = false"
                          class="shadow-theme-lg dark:bg-gray-dark absolute top-full right-0 z-40 w-40 space-y-1 rounded-2xl border border-gray-200 bg-white p-2 dark:border-gray-800"
                          style="display: none"
                        >
                          <button
                            class="text-theme-xs flex w-full rounded-lg px-3 py-2 text-left font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            View More
                          </button>
                          <button
                            class="text-theme-xs flex w-full rounded-lg px-3 py-2 text-left font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex items-center gap-3">
                        <div class="h-8 w-8">
                          <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg/images/brand/brand-15.svg" alt="brand" />
                        </div>

                        <div>
                          <span class="text-theme-sm block font-medium text-gray-700 dark:text-gray-400">Sell KKST</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-700 dark:text-gray-400">Oct 12, 03:54 PM</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-700 dark:text-gray-400">$6,754.99</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-700 dark:text-gray-400">Finance</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="col-span-1 flex items-center">
                      <p class="bg-success-50 text-theme-xs text-success-600 dark:bg-success-500/15 dark:text-success-500 rounded-full px-2 py-0.5 font-medium">Success</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center justify-center">
                      <div x-data="{openDropDown: false}" class="relative">
                        <button @click="openDropDown = !openDropDown" class="text-gray-500 dark:text-gray-400">
                          <svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M5.99902 10.245C6.96552 10.245 7.74902 11.0285 7.74902 11.995V12.005C7.74902 12.9715 6.96552 13.755 5.99902 13.755C5.03253 13.755 4.24902 12.9715 4.24902 12.005V11.995C4.24902 11.0285 5.03253 10.245 5.99902 10.245ZM17.999 10.245C18.9655 10.245 19.749 11.0285 19.749 11.995V12.005C19.749 12.9715 18.9655 13.755 17.999 13.755C17.0325 13.755 16.249 12.9715 16.249 12.005V11.995C16.249 11.0285 17.0325 10.245 17.999 10.245ZM13.749 11.995C13.749 11.0285 12.9655 10.245 11.999 10.245C11.0325 10.245 10.249 11.0285 10.249 11.995V12.005C10.249 12.9715 11.0325 13.755 11.999 13.755C12.9655 13.755 13.749 12.9715 13.749 12.005V11.995Z"
                              fill=""
                            ></path>
                          </svg>
                        </button>
                        <div
                          x-show="openDropDown"
                          @click.outside="openDropDown = false"
                          class="shadow-theme-lg dark:bg-gray-dark absolute top-full right-0 z-40 w-40 space-y-1 rounded-2xl border border-gray-200 bg-white p-2 dark:border-gray-800"
                          style="display: none"
                        >
                          <button
                            class="text-theme-xs flex w-full rounded-lg px-3 py-2 text-left font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            View More
                          </button>
                          <button
                            class="text-theme-xs flex w-full rounded-lg px-3 py-2 text-left font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex items-center gap-3">
                        <div class="h-8 w-8">
                          <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg/images/brand/brand-02.svg" alt="brand" />
                        </div>

                        <div>
                          <span class="text-theme-sm block font-medium text-gray-700 dark:text-gray-400">Bought FB</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-700 dark:text-gray-400">Sep 09, 02:00 AM</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-700 dark:text-gray-400">$1,445.41</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-700 dark:text-gray-400">Social mendia</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="col-span-1 flex items-center">
                      <p class="bg-success-50 text-theme-xs text-success-600 dark:bg-success-500/15 dark:text-success-500 rounded-full px-2 py-0.5 font-medium">Success</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center justify-center">
                      <div x-data="{openDropDown: false}" class="relative">
                        <button @click="openDropDown = !openDropDown" class="text-gray-500 dark:text-gray-400">
                          <svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M5.99902 10.245C6.96552 10.245 7.74902 11.0285 7.74902 11.995V12.005C7.74902 12.9715 6.96552 13.755 5.99902 13.755C5.03253 13.755 4.24902 12.9715 4.24902 12.005V11.995C4.24902 11.0285 5.03253 10.245 5.99902 10.245ZM17.999 10.245C18.9655 10.245 19.749 11.0285 19.749 11.995V12.005C19.749 12.9715 18.9655 13.755 17.999 13.755C17.0325 13.755 16.249 12.9715 16.249 12.005V11.995C16.249 11.0285 17.0325 10.245 17.999 10.245ZM13.749 11.995C13.749 11.0285 12.9655 10.245 11.999 10.245C11.0325 10.245 10.249 11.0285 10.249 11.995V12.005C10.249 12.9715 11.0325 13.755 11.999 13.755C12.9655 13.755 13.749 12.9715 13.749 12.005V11.995Z"
                              fill=""
                            ></path>
                          </svg>
                        </button>
                        <div
                          x-show="openDropDown"
                          @click.outside="openDropDown = false"
                          class="shadow-theme-lg dark:bg-gray-dark absolute right-0 bottom-full z-40 w-40 space-y-1 rounded-2xl border border-gray-200 bg-white p-2 dark:border-gray-800"
                          style="display: none"
                        >
                          <button
                            class="text-theme-xs flex w-full rounded-lg px-3 py-2 text-left font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            View More
                          </button>
                          <button
                            class="text-theme-xs flex w-full rounded-lg px-3 py-2 text-left font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex items-center gap-3">
                        <div class="h-8 w-8">
                          <img src="https://demo.tailadmin.com/src/images/brand/brand-07.svg" alt="brand" />
                        </div>

                        <div>
                          <span class="text-theme-sm block font-medium text-gray-700 dark:text-gray-400">Sell AMZN</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-700 dark:text-gray-400">Feb 35, 08:00 PM</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-700 dark:text-gray-400">$5,698.55</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <p class="text-theme-sm text-gray-700 dark:text-gray-400">E-commerce</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="col-span-1 flex items-center">
                      <p class="bg-error-50 text-theme-xs text-error-600 dark:bg-error-500/15 dark:text-error-500 rounded-full px-2 py-0.5 font-medium">Failed</p>
                    </div>
                  </td>
                  <td class="py-3 whitespace-nowrap">
                    <div class="flex items-center justify-center">
                      <div x-data="{openDropDown: false}" class="relative">
                        <button @click="openDropDown = !openDropDown" class="text-gray-500 dark:text-gray-400">
                          <svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M5.99902 10.245C6.96552 10.245 7.74902 11.0285 7.74902 11.995V12.005C7.74902 12.9715 6.96552 13.755 5.99902 13.755C5.03253 13.755 4.24902 12.9715 4.24902 12.005V11.995C4.24902 11.0285 5.03253 10.245 5.99902 10.245ZM17.999 10.245C18.9655 10.245 19.749 11.0285 19.749 11.995V12.005C19.749 12.9715 18.9655 13.755 17.999 13.755C17.0325 13.755 16.249 12.9715 16.249 12.005V11.995C16.249 11.0285 17.0325 10.245 17.999 10.245ZM13.749 11.995C13.749 11.0285 12.9655 10.245 11.999 10.245C11.0325 10.245 10.249 11.0285 10.249 11.995V12.005C10.249 12.9715 11.0325 13.755 11.999 13.755C12.9655 13.755 13.749 12.9715 13.749 12.005V11.995Z"
                              fill=""
                            ></path>
                          </svg>
                        </button>
                        <div
                          x-show="openDropDown"
                          @click.outside="openDropDown = false"
                          class="shadow-theme-lg dark:bg-gray-dark absolute right-0 bottom-full z-40 w-40 space-y-1 rounded-2xl border border-gray-200 bg-white p-2 dark:border-gray-800"
                          style="display: none"
                        >
                          <button
                            class="text-theme-xs flex w-full rounded-lg px-3 py-2 text-left font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            View More
                          </button>
                          <button
                            class="text-theme-xs flex w-full rounded-lg px-3 py-2 text-left font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <div class="flex items-center justify-between">
              <button
                class="text-theme-sm shadow-theme-xs flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-2 py-2 font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 sm:px-3.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M2.58301 9.99868C2.58272 10.1909 2.65588 10.3833 2.80249 10.53L7.79915 15.5301C8.09194 15.8231 8.56682 15.8233 8.85981 15.5305C9.15281 15.2377 9.15297 14.7629 8.86018 14.4699L5.14009 10.7472L16.6675 10.7472C17.0817 10.7472 17.4175 10.4114 17.4175 9.99715C17.4175 9.58294 17.0817 9.24715 16.6675 9.24715L5.14554 9.24715L8.86017 5.53016C9.15297 5.23717 9.15282 4.7623 8.85983 4.4695C8.56684 4.1767 8.09197 4.17685 7.79917 4.46984L2.84167 9.43049C2.68321 9.568 2.58301 9.77087 2.58301 9.99715C2.58301 9.99766 2.58301 9.99817 2.58301 9.99868Z"
                    fill=""
                  ></path>
                </svg>

                <span class="hidden sm:inline">Previous</span>
              </button>

              <span class="block text-sm font-medium text-gray-700 sm:hidden dark:text-gray-400">Page 1 of 10</span>

              <ul class="hidden items-center gap-0.5 sm:flex">
                <li>
                  <a
                    href="#"
                    class="bg-brand-500/[0.08] text-theme-sm text-brand-500 hover:bg-brand-500/[0.08] hover:text-brand-500 dark:text-brand-500 dark:hover:text-brand-500 flex h-10 w-10 items-center justify-center rounded-lg font-medium"
                  >
                    1
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    class="text-theme-sm hover:bg-brand-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500 flex h-10 w-10 items-center justify-center rounded-lg font-medium text-gray-700 dark:text-gray-400"
                  >
                    2
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    class="text-theme-sm hover:bg-brand-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500 flex h-10 w-10 items-center justify-center rounded-lg font-medium text-gray-700 dark:text-gray-400"
                  >
                    3
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    class="text-theme-sm hover:bg-brand-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500 flex h-10 w-10 items-center justify-center rounded-lg font-medium text-gray-700 dark:text-gray-400"
                  >
                    ...
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    class="text-theme-sm hover:bg-brand-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500 flex h-10 w-10 items-center justify-center rounded-lg font-medium text-gray-700 dark:text-gray-400"
                  >
                    8
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    class="text-theme-sm hover:bg-brand-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500 flex h-10 w-10 items-center justify-center rounded-lg font-medium text-gray-700 dark:text-gray-400"
                  >
                    9
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    class="text-theme-sm hover:bg-brand-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500 flex h-10 w-10 items-center justify-center rounded-lg font-medium text-gray-700 dark:text-gray-400"
                  >
                    10
                  </a>
                </li>
              </ul>

              <button
                class="text-theme-sm shadow-theme-xs flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-2 py-2 font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 sm:px-3.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                <span class="hidden sm:inline">Next</span>

                <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M17.4175 9.9986C17.4178 10.1909 17.3446 10.3832 17.198 10.53L12.2013 15.5301C11.9085 15.8231 11.4337 15.8233 11.1407 15.5305C10.8477 15.2377 10.8475 14.7629 11.1403 14.4699L14.8604 10.7472L3.33301 10.7472C2.91879 10.7472 2.58301 10.4114 2.58301 9.99715C2.58301 9.58294 2.91879 9.24715 3.33301 9.24715L14.8549 9.24715L11.1403 5.53016C10.8475 5.23717 10.8477 4.7623 11.1407 4.4695C11.4336 4.1767 11.9085 4.17685 12.2013 4.46984L17.1588 9.43049C17.3173 9.568 17.4175 9.77087 17.4175 9.99715C17.4175 9.99763 17.4175 9.99812 17.4175 9.9986Z"
                    fill=""
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <!-- Table Five -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
