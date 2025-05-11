<template>
  <div>
    <VBreadcrumb :items="[{ name: 'Home', path: '/' }, { name: 'Video' }]" />

    <div class="space-y-6">
      <!-- Metrics Start -->
      <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Overview</h3>
          </div>
          <div class="flex gap-x-3.5">
            <div x-data="{selected: 'weekly'}" class="inline-flex w-full items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
              <button
                @click="selected = 'weekly'"
                :class="selected === 'weekly' ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400'"
                class="text-theme-sm w-full rounded-md px-3 py-2 font-medium hover:text-gray-900 dark:hover:text-white shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
              >
                Weekly
              </button>
              <button
                @click="selected = 'monthly'"
                :class="selected === 'monthly' ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400'"
                class="text-theme-sm w-full rounded-md px-3 py-2 font-medium hover:text-gray-900 dark:hover:text-white text-gray-500 dark:text-gray-400"
              >
                Monthly
              </button>
              <button
                @click="selected = 'yearly'"
                :class="selected === 'yearly' ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400'"
                class="text-theme-sm w-full rounded-md px-3 py-2 font-medium hover:text-gray-900 dark:hover:text-white text-gray-500 dark:text-gray-400"
              >
                Yearly
              </button>
            </div>
            <div>
              <button
                class="text-theme-sm shadow-theme-xs inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                <svg class="fill-white stroke-current dark:fill-gray-800" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.29004 5.90393H17.7067" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                  <path d="M17.7075 14.0961H2.29085" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                  <path
                    d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z"
                    fill=""
                    stroke=""
                    stroke-width="1.5"
                  ></path>
                  <path
                    d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z"
                    fill=""
                    stroke=""
                    stroke-width="1.5"
                  ></path>
                </svg>

                <span class="hidden sm:block">Filter</span>
              </button>
            </div>
          </div>
        </div>
        <div class="grid rounded-2xl border border-gray-200 bg-white sm:grid-cols-2 xl:grid-cols-4 dark:border-gray-800 dark:bg-gray-900">
          <div class="border-b border-gray-200 px-6 py-5 sm:border-r xl:border-b-0 dark:border-gray-800">
            <span class="text-sm text-gray-500 dark:text-gray-400">Total Revenue</span>
            <div class="mt-2 flex items-end gap-3">
              <h4 class="text-title-xs sm:text-title-sm font-bold text-gray-800 dark:text-white/90">$200,45.87</h4>
              <div>
                <span class="bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500 flex items-center gap-1 rounded-full py-0.5 pr-2.5 pl-2 text-sm font-medium">+2.5%</span>
              </div>
            </div>
          </div>
          <div class="border-b border-gray-200 px-6 py-5 xl:border-r xl:border-b-0 dark:border-gray-800">
            <span class="text-sm text-gray-500 dark:text-gray-400">Active Users</span>
            <div class="mt-2 flex items-end gap-3">
              <h4 class="text-title-xs sm:text-title-sm font-bold text-gray-800 dark:text-white/90">9,528</h4>
              <div>
                <span class="bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500 flex items-center gap-1 rounded-full py-0.5 pr-2.5 pl-2 text-sm font-medium">+ 9.5%</span>
              </div>
            </div>
          </div>
          <div class="border-b border-gray-200 px-6 py-5 sm:border-r sm:border-b-0 dark:border-gray-800">
            <div>
              <span class="text-sm text-gray-500 dark:text-gray-400">Customer Lifetime Value</span>
              <div class="mt-2 flex items-end gap-3">
                <h4 class="text-title-xs sm:text-title-sm font-bold text-gray-800 dark:text-white/90">$849.54</h4>
                <div>
                  <span class="bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500 flex items-center gap-1 rounded-full py-0.5 pr-2.5 pl-2 text-sm font-medium">-1.6%</span>
                </div>
              </div>
            </div>
          </div>
          <div class="px-6 py-5">
            <span class="text-sm text-gray-500 dark:text-gray-400">Customer Acquisition Cost</span>
            <div class="mt-2 flex items-end gap-3">
              <h4 class="text-title-xs sm:text-title-sm font-bold text-gray-800 dark:text-white/90">9,528</h4>
              <div>
                <span class="bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500 flex items-center gap-1 rounded-full py-0.5 pr-2.5 pl-2 text-sm font-medium">+3.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Metrics End -->
      <div class="gap-5 space-y-5 sm:gap-6 sm:space-y-6 xl:grid xl:grid-cols-12 xl:space-y-0">
        <div class="xl:col-span-7 2xl:col-span-8">
          <div class="space-y-5 sm:space-y-6">
            <!-- Chart -->
            <div class="grid gap-5 sm:gap-6 lg:grid-cols-2">
              <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div class="mb-6 flex justify-between">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Churn Rate</h3>
                    <p class="text-theme-sm mt-1 text-gray-500 dark:text-gray-400">Downgrade to Free plan</p>
                  </div>
                  <div x-data="{openDropDown: false}" class="relative h-fit">
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
                <div class="flex justify-between">
                  <div>
                    <h3 class="text-title-xs font-semibold text-gray-800 dark:text-white/90">4.26%</h3>
                    <p class="text-theme-xs mt-1 text-gray-500 dark:text-gray-400">
                      <span class="text-error-500 mr-1 inline-block">0.31%</span>
                      than last Week
                    </p>
                  </div>
                  <div class="max-w-full">
                    <div id="chartTwentyOne" class="h-12 w-24" style="min-height: 60px">
                      <div id="apexchartsov6j4qcj" class="apexcharts-canvas apexchartsov6j4qcj apexcharts-theme-" style="width: 96px; height: 60px">
                        <div class="apexcharts-tooltip apexcharts-theme-light">
                          <div class="apexcharts-tooltip-series-group apexcharts-tooltip-series-group-0" style="order: 1">
                            <span class="apexcharts-tooltip-marker" style="background-color: rgb(239, 68, 68)"></span>
                            <div class="apexcharts-tooltip-text" style="font-family: Helvetica, Arial, sans-serif; font-size: 12px">
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
              </div>
              <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div class="mb-6 flex justify-between">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">User Growth</h3>
                    <p class="text-theme-sm mt-1 text-gray-500 dark:text-gray-400">New signups website + mobile</p>
                  </div>
                  <div x-data="{openDropDown: false}" class="relative h-fit">
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
                <div class="flex justify-between">
                  <div>
                    <h3 class="text-title-xs font-semibold text-gray-800 dark:text-white/90">3,768</h3>
                    <p class="text-theme-xs mt-1 text-gray-500 dark:text-gray-400">
                      <span class="text-success-600 mr-1 inline-block">+3.85%</span>
                      than last Week
                    </p>
                  </div>
                  <div class="max-w-full">
                    <div id="chartTwentyTwo" class="h-12 w-24" style="min-height: 60px">
                      <div id="apexchartsogzl0bvd" class="apexcharts-canvas apexchartsogzl0bvd apexcharts-theme-" style="width: 96px; height: 60px">
                        <div class="apexcharts-tooltip apexcharts-theme-light">
                          <div class="apexcharts-tooltip-series-group apexcharts-tooltip-series-group-0" style="order: 1">
                            <span class="apexcharts-tooltip-marker" style="background-color: rgb(16, 185, 129)"></span>
                            <div class="apexcharts-tooltip-text" style="font-family: Helvetica, Arial, sans-serif; font-size: 12px">
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
              </div>
            </div>
            <!-- Funnel Chart -->
            <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="mb-6 flex justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Conversion Funnel</h3>
                </div>
                <div x-data="{openDropDown: false}" class="relative h-fit">
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
              <div class="custom-scrollbar max-w-full overflow-x-auto">
                <div id="chartSeventeen" class="-ml-5 min-w-[700px] pl-2" style="min-height: 330px">
                  <div id="apexchartsa32dstf4j" class="apexcharts-canvas apexchartsa32dstf4j apexcharts-theme-" style="width: 692px; height: 315px">
                    <div class="apexcharts-tooltip apexcharts-theme-light">
                      <div class="apexcharts-tooltip-series-group apexcharts-tooltip-series-group-0" style="order: 1">
                        <span class="apexcharts-tooltip-marker" style="background-color: rgb(42, 49, 216)"></span>
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
                      <div class="apexcharts-tooltip-series-group apexcharts-tooltip-series-group-1" style="order: 2">
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
                      <div class="apexcharts-tooltip-series-group apexcharts-tooltip-series-group-2" style="order: 3">
                        <span class="apexcharts-tooltip-marker" style="background-color: rgb(117, 146, 255)"></span>
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
                      <div class="apexcharts-tooltip-series-group apexcharts-tooltip-series-group-3" style="order: 4">
                        <span class="apexcharts-tooltip-marker" style="background-color: rgb(194, 214, 255)"></span>
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
            <!-- Funnel Chart End -->
            <!-- Invoice Table -->
            <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="px-6 py-4">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Recent Invoices</h3>
              </div>
              <div class="custom-scrollbar overflow-x-auto">
                <table class="min-w-full">
                  <thead>
                    <tr class="bg-gray-50 dark:bg-gray-900">
                      <th class="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">Serial No:</th>
                      <th class="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">Close Date</th>
                      <th class="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">User</th>
                      <th class="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">Amount</th>
                      <th class="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                    <tr>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">#DF429</td>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">April 28, 2016</td>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">Jenny Wilson</td>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">$473.85</td>
                      <td class="px-6 py-4 text-left">
                        <span class="bg-success-50 text-theme-xs text-success-600 dark:bg-success-500/15 dark:text-success-500 rounded-full px-2 py-0.5 font-medium">Complete</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">#HTY274</td>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">October 30, 2017</td>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">Wade Warren</td>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">$293.01</td>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                        <span class="bg-success-50 text-theme-xs text-success-600 dark:bg-success-500/15 dark:text-success-500 rounded-full px-2 py-0.5 font-medium">Complete</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">#LKE600</td>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">May 29, 2017</td>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">Darlene Robertson</td>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">$782.01</td>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                        <span class="bg-warning-50 text-theme-xs text-warning-600 dark:bg-warning-500/15 dark:text-warning-500 rounded-full px-2 py-0.5 font-medium">Pending</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">#HRP447</td>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">May 20, 2015</td>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">Arlene McCoy</td>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">$202.87</td>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                        <span class="bg-error-50 text-theme-xs text-error-600 dark:bg-error-500/15 dark:text-error-500 rounded-full px-2 py-0.5 font-medium">Cancelled</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">#WRH647</td>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">March 13, 2014</td>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">Bessie Cooper</td>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">$490.51</td>
                      <td class="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                        <span class="bg-success-50 text-theme-xs text-success-600 dark:bg-success-500/15 dark:text-success-500 rounded-full px-2 py-0.5 font-medium">Complete</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="space-y-6 xl:col-span-5 2xl:col-span-4">
          <!-- Product Performance -->
          <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="mb-6 flex justify-between">
              <div>
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Product Performance</h3>
              </div>
              <div x-data="{openDropDown: false}" class="relative h-fit">
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
            <div x-data="{selected: 'daily'}">
              <div class="flex w-full items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
                <button
                  @click="selected = 'daily'"
                  :class="selected === 'daily' ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400'"
                  class="text-theme-sm w-full rounded-md px-3 py-2 font-medium hover:text-gray-900 dark:hover:text-white shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                >
                  Daily Sales
                </button>
                <button
                  @click="selected = 'online'"
                  :class="selected === 'online' ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400'"
                  class="text-theme-sm w-full rounded-md px-3 py-2 font-medium hover:text-gray-900 dark:hover:text-white text-gray-500 dark:text-gray-400"
                >
                  Online Sales
                </button>
                <button
                  @click="selected = 'new'"
                  :class="selected === 'new' ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400'"
                  class="text-theme-sm w-full rounded-md px-3 py-2 font-medium hover:text-gray-900 dark:hover:text-white text-gray-500 dark:text-gray-400"
                >
                  New Users
                </button>
              </div>
              <!-- Tab Panels -->
              <div class="mt-4">
                <!-- Daily Sales Panel -->
                <div x-show="selected === 'daily'" class="space-y-4">
                  <div
                    class="grid grid-cols-2 justify-between gap-10 divide-x divide-gray-100 rounded-xl border border-gray-100 bg-white py-4 dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-800/[0.03]"
                  >
                    <div class="px-5">
                      <span class="block text-sm text-gray-500 dark:text-gray-400">Digital Product</span>
                      <div class="mt-1 flex items-center gap-2">
                        <span class="bg-success-50 dark:bg-success-500/15 text-success-600 inline-flex size-5 items-center justify-center rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M5.56462 1.62411C5.70194 1.47091 5.90136 1.37451 6.12329 1.37451C6.1236 1.37451 6.1239 1.37451 6.12421 1.37451C6.3163 1.37434 6.50845 1.4475 6.65505 1.594L9.65514 4.59199C9.94814 4.88478 9.94831 5.35966 9.65552 5.65265C9.36272 5.94565 8.88785 5.94581 8.59486 5.65302L6.87329 3.93267L6.87329 10.1252C6.87329 10.5394 6.53751 10.8752 6.12329 10.8752C5.70908 10.8752 5.37329 10.5394 5.37329 10.1252L5.37329 3.93597L3.65516 5.65301C3.36218 5.94581 2.8873 5.94566 2.5945 5.65267C2.3017 5.35968 2.30185 4.88481 2.59484 4.59201L5.56462 1.62411Z"
                              fill="currentColor"
                            ></path>
                          </svg>
                        </span>
                        <h4 class="text-xl font-semibold text-gray-800 dark:text-white/90">790</h4>
                      </div>
                    </div>
                    <div class="px-5">
                      <span class="block text-sm text-gray-500 dark:text-gray-400">Physical Product</span>
                      <div class="mt-1 flex items-center gap-2">
                        <span class="bg-error-50 dark:bg-error-500/15 text-error-600 inline-flex size-5 items-center justify-center rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M5.31462 10.3761C5.45194 10.5293 5.65136 10.6257 5.87329 10.6257C5.8736 10.6257 5.8739 10.6257 5.87421 10.6257C6.0663 10.6259 6.25845 10.5527 6.40505 10.4062L9.40514 7.4082C9.69814 7.11541 9.69831 6.64054 9.40552 6.34754C9.11273 6.05454 8.63785 6.05438 8.34486 6.34717L6.62329 8.06753L6.62329 1.875C6.62329 1.46079 6.28751 1.125 5.87329 1.125C5.45908 1.125 5.12329 1.46079 5.12329 1.875L5.12329 8.06422L3.40516 6.34719C3.11218 6.05439 2.6373 6.05454 2.3445 6.34752C2.0517 6.64051 2.05185 7.11538 2.34484 7.40818L5.31462 10.3761Z"
                              fill="currentColor"
                            ></path>
                          </svg>
                        </span>
                        <h4 class="text-xl font-semibold text-gray-800 dark:text-white/90">572</h4>
                      </div>
                    </div>
                  </div>
                  <div class="rounded-xl border border-gray-100 px-5 py-4 dark:border-gray-800">
                    <div class="mb-3 flex items-start justify-between">
                      <div>
                        <span class="text-theme-sm font-medium text-gray-500 dark:text-gray-400">Average Daily Sales</span>
                        <h3 class="text-title-sm font-semibold text-gray-800 dark:text-white/90">$2,950</h3>
                      </div>
                      <div>
                        <span class="bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500 flex items-center gap-1 rounded-full py-0.5 pr-2.5 pl-2 text-sm font-medium">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M5.31462 10.3761C5.45194 10.5293 5.65136 10.6257 5.87329 10.6257C5.8736 10.6257 5.8739 10.6257 5.87421 10.6257C6.0663 10.6259 6.25845 10.5527 6.40505 10.4062L9.40514 7.4082C9.69814 7.11541 9.69831 6.64054 9.40552 6.34754C9.11273 6.05454 8.63785 6.05438 8.34486 6.34717L6.62329 8.06753L6.62329 1.875C6.62329 1.46079 6.28751 1.125 5.87329 1.125C5.45908 1.125 5.12329 1.46079 5.12329 1.875L5.12329 8.06422L3.40516 6.34719C3.11218 6.05439 2.6373 6.05454 2.3445 6.34752C2.0517 6.64051 2.05185 7.11538 2.34484 7.40818L5.31462 10.3761Z"
                              fill="currentColor"
                            ></path>
                          </svg>
                          0.52%
                        </span>
                      </div>
                    </div>
                    <!-- Chart -->
                    <div class="overflow-x-auto">
                      <div id="chartEighteen" class="-ml-3" style="min-height: 215px">
                        <div id="apexchartsf67b0w1l" class="apexcharts-canvas apexchartsf67b0w1l apexcharts-theme-" style="width: 301px; height: 200px">
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
                </div>

                <!-- Online Sales Panel -->
                <div x-show="selected === 'online'" class="space-y-4" style="display: none">
                  <div class="grid grid-cols-2 justify-between gap-10 divide-x divide-gray-100 rounded-xl border border-gray-100 py-4 dark:divide-gray-800 dark:border-gray-800">
                    <div class="px-5">
                      <span class="block text-sm text-gray-500 dark:text-gray-400">Digital Product</span>
                      <div class="mt-1 flex items-center gap-2">
                        <span class="bg-success-50 dark:bg-success-500/15 text-success-600 inline-flex size-5 items-center justify-center rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M5.56462 1.62411C5.70194 1.47091 5.90136 1.37451 6.12329 1.37451C6.1236 1.37451 6.1239 1.37451 6.12421 1.37451C6.3163 1.37434 6.50845 1.4475 6.65505 1.594L9.65514 4.59199C9.94814 4.88478 9.94831 5.35966 9.65552 5.65265C9.36272 5.94565 8.88785 5.94581 8.59486 5.65302L6.87329 3.93267L6.87329 10.1252C6.87329 10.5394 6.53751 10.8752 6.12329 10.8752C5.70908 10.8752 5.37329 10.5394 5.37329 10.1252L5.37329 3.93597L3.65516 5.65301C3.36218 5.94581 2.8873 5.94566 2.5945 5.65267C2.3017 5.35968 2.30185 4.88481 2.59484 4.59201L5.56462 1.62411Z"
                              fill="currentColor"
                            ></path>
                          </svg>
                        </span>
                        <h4 class="text-xl font-semibold text-gray-800 dark:text-white/90">8,490</h4>
                      </div>
                    </div>
                    <div class="px-5">
                      <span class="block text-sm text-gray-500 dark:text-gray-400">Physical Product</span>
                      <div class="mt-1 flex items-center gap-2">
                        <span class="bg-error-50 dark:bg-error-500/15 text-error-600 inline-flex size-5 items-center justify-center rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M5.31462 10.3761C5.45194 10.5293 5.65136 10.6257 5.87329 10.6257C5.8736 10.6257 5.8739 10.6257 5.87421 10.6257C6.0663 10.6259 6.25845 10.5527 6.40505 10.4062L9.40514 7.4082C9.69814 7.11541 9.69831 6.64054 9.40552 6.34754C9.11273 6.05454 8.63785 6.05438 8.34486 6.34717L6.62329 8.06753L6.62329 1.875C6.62329 1.46079 6.28751 1.125 5.87329 1.125C5.45908 1.125 5.12329 1.46079 5.12329 1.875L5.12329 8.06422L3.40516 6.34719C3.11218 6.05439 2.6373 6.05454 2.3445 6.34752C2.0517 6.64051 2.05185 7.11538 2.34484 7.40818L5.31462 10.3761Z"
                              fill="currentColor"
                            ></path>
                          </svg>
                        </span>
                        <h4 class="text-xl font-semibold text-gray-800 dark:text-white/90">950</h4>
                      </div>
                    </div>
                  </div>
                  <div class="rounded-xl border border-gray-100 px-5 py-4 dark:border-gray-800">
                    <div class="mb-3 flex items-start justify-between">
                      <div>
                        <span class="text-theme-sm font-medium text-gray-500 dark:text-gray-400">Total Online Sales</span>
                        <h3 class="text-title-sm font-semibold text-gray-800 dark:text-white/90">$59,410</h3>
                      </div>
                      <div>
                        <span class="bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500 flex items-center gap-1 rounded-full py-0.5 pr-2.5 pl-2 text-sm font-medium">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M5.56462 1.62411C5.70194 1.47091 5.90136 1.37451 6.12329 1.37451C6.1236 1.37451 6.12391 1.37451 6.12421 1.37451C6.3163 1.37434 6.50845 1.4475 6.65505 1.594L9.65514 4.59199C9.94814 4.88478 9.94831 5.35966 9.65552 5.65265C9.36272 5.94565 8.88785 5.94581 8.59486 5.65302L6.87329 3.93267L6.87329 10.1252C6.87329 10.5394 6.53751 10.8752 6.12329 10.8752C5.70908 10.8752 5.37329 10.5394 5.37329 10.1252L5.37329 3.93597L3.65516 5.65301C3.36218 5.94581 2.8873 5.94566 2.5945 5.65267C2.3017 5.35968 2.30185 4.88481 2.59484 4.59201L5.56462 1.62411Z"
                              fill="currentColor"
                            ></path>
                          </svg>
                          0.52%
                        </span>
                      </div>
                    </div>
                    <!-- Chart -->
                    <div class="custom-scrollbar max-w-full overflow-x-auto">
                      <div id="chartNineteen" class="-ml-3 w-full" style="min-height: 215px">
                        <div id="apexchartstljenzrw" class="apexcharts-canvas apexchartstljenzrw" style="width: 0px; height: 200px"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- New Users Panel -->
                <div x-show="selected === 'new'" class="space-y-4" style="display: none">
                  <div class="grid grid-cols-2 justify-between gap-4 rounded-xl border border-gray-100 py-4 dark:border-gray-800">
                    <div class="px-5">
                      <div class="flex -space-x-3">
                        <img src="@/assets/images/product-01.jpg" class="size-12 rounded-full ring-2 ring-white dark:ring-gray-800/90" alt="" />
                        <img src="@/assets/images/product-01.jpg" class="size-12 rounded-full ring-2 ring-white dark:ring-gray-800/90" alt="" />
                        <img src="@/assets/images/product-01.jpg" class="size-12 rounded-full ring-2 ring-white dark:ring-gray-800/90" alt="" />
                        <div class="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-700 ring-2 ring-white dark:ring-gray-800/90">
                          10+
                        </div>
                      </div>
                    </div>
                    <div class="px-5">
                      <span class="block text-sm text-gray-500 dark:text-gray-400">Added last month</span>
                      <div class="mt-1 flex items-center gap-2">
                        <h4 class="text-xl font-semibold text-gray-800 dark:text-white/90">8,490</h4>
                      </div>
                    </div>
                  </div>
                  <div class="rounded-xl border border-gray-100 px-5 py-4 dark:border-gray-800">
                    <div class="mb-3 flex items-start justify-between">
                      <div>
                        <span class="text-theme-sm font-medium text-gray-500 dark:text-gray-400">Total New Users</span>
                        <h3 class="text-title-sm font-semibold text-gray-800 dark:text-white/90">5.9K</h3>
                      </div>
                      <div>
                        <span class="bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500 flex items-center gap-1 rounded-full py-0.5 pr-2.5 pl-2 text-sm font-medium">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M5.56462 1.62411C5.70194 1.47091 5.90136 1.37451 6.12329 1.37451C6.1236 1.37451 6.12391 1.37451 6.12421 1.37451C6.3163 1.37434 6.50845 1.4475 6.65505 1.594L9.65514 4.59199C9.94814 4.88478 9.94831 5.35966 9.65552 5.65265C9.36272 5.94565 8.88785 5.94581 8.59486 5.65302L6.87329 3.93267L6.87329 10.1252C6.87329 10.5394 6.53751 10.8752 6.12329 10.8752C5.70908 10.8752 5.37329 10.5394 5.37329 10.1252L5.37329 3.93597L3.65516 5.65301C3.36218 5.94581 2.8873 5.94566 2.5945 5.65267C2.3017 5.35968 2.30185 4.88481 2.59484 4.59201L5.56462 1.62411Z"
                              fill="currentColor"
                            ></path>
                          </svg>
                          0.52%
                        </span>
                      </div>
                    </div>
                    <!-- Chart -->
                    <div>
                      <div id="chartTwenty" class="-ml-2 w-full" style="min-height: 215px">
                        <div id="apexchartsamo45ic2" class="apexcharts-canvas apexchartsamo45ic2" style="width: 0px; height: 200px"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Product Performance End -->

          <!-- Activities  -->
          <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="mb-6 flex justify-between">
              <div>
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Activities</h3>
              </div>
              <div x-data="{openDropDown: false}" class="relative h-fit">
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
            <div class="relative">
              <!-- Timeline line -->
              <div class="absolute top-6 bottom-10 left-5 w-px bg-gray-200 dark:bg-gray-800"></div>

              <!-- Francisco Grbbs -->
              <div class="relative mb-6 flex">
                <div class="z-10 flex-shrink-0">
                  <img src="@/assets/images/product-01.jpg" alt="Francisco Grbbs" class="size-10 rounded-full object-cover ring-4 ring-white dark:ring-gray-800" />
                </div>
                <div class="ml-4">
                  <div class="mb-1 flex items-center gap-1">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M9 5.0625H14.0625L12.5827 8.35084C12.4506 8.64443 12.4506 8.98057 12.5827 9.27416L14.0625 12.5625H10.125C9.50368 12.5625 9 12.0588 9 11.4375V10.875M3.9375 10.875H9M3.9375 3.375H7.875C8.49632 3.375 9 3.87868 9 4.5V10.875M3.9375 15.9375V2.0625"
                        stroke="#12B76A"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></path>
                    </svg>
                    <p class="text-theme-xs text-success-500 font-medium">New invoice</p>
                  </div>
                  <div class="flex items-baseline">
                    <h3 class="text-theme-sm font-medium text-gray-800 dark:text-white/90">Francisco Grbbs</h3>
                    <span class="text-theme-sm ml-2 font-normal text-gray-500 dark:text-gray-400">created invoice</span>
                  </div>
                  <p class="text-theme-sm font-normal text-gray-500 dark:text-gray-400">PQ-4491C</p>
                  <p class="text-theme-xs mt-1 text-gray-400">Just Now</p>
                </div>
              </div>

              <!-- Courtney Henry -->
              <div class="relative mb-6 flex">
                <div class="z-10 flex-shrink-0">
                  <img src="@/assets/images/product-01.jpg" alt="Courtney Henry" class="size-10 rounded-full object-cover ring-4 ring-white dark:ring-gray-800" />
                </div>
                <div class="ml-4">
                  <div class="flex items-baseline">
                    <h3 class="text-theme-sm font-semibold text-gray-800 dark:text-white/90">Courtney Henry</h3>
                    <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">created invoice</span>
                  </div>
                  <p class="text-theme-sm font-normal text-gray-500 dark:text-gray-400">HK-234G</p>
                  <p class="text-theme-xs mt-1 text-gray-400">15 minutes ago</p>
                </div>
              </div>

              <!-- Bessie Cooper -->
              <div class="relative mb-6 flex">
                <div class="z-10 flex-shrink-0">
                  <img src="@/assets/images/product-01.jpg" alt="Bessie Cooper" class="size-10 rounded-full object-cover ring-4 ring-white dark:ring-gray-800" />
                </div>
                <div class="ml-4">
                  <div class="flex items-baseline">
                    <h3 class="text-theme-sm font-semibold text-gray-800 dark:text-white/90">Bessie Cooper</h3>
                    <span class="text-theme-sm ml-2 text-gray-500 dark:text-gray-400">created invoice</span>
                  </div>
                  <p class="text-theme-sm font-normal text-gray-500 dark:text-gray-400">LH-2891C</p>
                  <p class="text-theme-xs mt-1 text-gray-400">5 months ago</p>
                </div>
              </div>

              <!-- Theresa Web -->
              <div class="relative flex">
                <div class="z-10 flex-shrink-0">
                  <img src="@/assets/images/product-01.jpg" alt="Theresa Web" class="size-10 rounded-full object-cover ring-4 ring-white dark:ring-gray-800" />
                </div>
                <div class="ml-4">
                  <div class="flex items-baseline">
                    <h3 class="text-theme-sm font-semibold text-gray-800 dark:text-white/90">Theresa Web</h3>
                    <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">created invoice</span>
                  </div>
                  <p class="text-theme-sm font-normal text-gray-500 dark:text-gray-400">CK-125NH</p>
                  <p class="text-theme-xs mt-1 text-gray-400">2 weeks ago</p>
                </div>
              </div>
            </div>
          </div>
          <!-- Activities End -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
