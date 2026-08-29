<?php
namespace MetForm_Pro\Core\Features\Quiz;

defined('ABSPATH') || exit;

class Overview_Chart
{
    public static function get_quiz_overview_data_chart($conrrect_percentage, $wrong_percentage){

        $data = '';
        $colors = '';

        if($conrrect_percentage > 0 && $wrong_percentage > 0){
            // There is both correct and wrong answers
            $data = "
                \"". __('Wrong Answers', 'metform-pro') ."\": $wrong_percentage,
                \"". __('Correct Answers', 'metform-pro') ."\": $conrrect_percentage
            ";
            $colors = '["#f2dede", "#69ae4b"]';
        } elseif($conrrect_percentage > 0 && $wrong_percentage <= 0){
            // All the answers is correct
            $data = "
                \"". __('Correct Answers', 'metform-pro') ."\": $conrrect_percentage
            ";
            $colors = '["#69ae4b"]';
        } elseif($conrrect_percentage <= 0 && $wrong_percentage > 0) {
            // All the answers is wrong
            $data = "
                \"". __('Wrong Answers', 'metform-pro') ."\": $wrong_percentage
            ";
            $colors = '["#f2dede"]';
        } else {
            // there is no answers by the user
            return '';
        }

        $quiz_result_title = __('Quiz Result Overview', 'metform-pro');

        $output = <<<OUTPUT
        <div class="quiz_overview_chart">
            <canvas id="quiz_overview_canvas"></canvas>
            <div for="quiz_overview_canvas"></div>
        </div>
        <script>
        // Load the charts inside HTML
        var mfQuizOverviewCanvas = document.getElementById("quiz_overview_canvas");
        mfQuizOverviewCanvas.width = 500;
        mfQuizOverviewCanvas.height = 340;

        var mfChart = new MfCharts({
            canvas: mfQuizOverviewCanvas,
            seriesName: "$quiz_result_title",
            padding: 30,
            data: {
                $data
            },
            colors: $colors,
            titleOptions: {
                align: "center",
                fill: "black",
                font: {
                    weight: "bold",
                    size: "18px",
                    family: "Lato"
                }
            }
        });
        mfChart.draw();
        </script>
OUTPUT;


        return $output;
    }
}