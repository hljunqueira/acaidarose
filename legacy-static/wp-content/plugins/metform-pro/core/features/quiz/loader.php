<?php

namespace MetForm_Pro\Core\Features\Quiz;

use MetForm_Pro\Traits\Singleton;
use MetForm_Pro\Core\Features\Quiz\Overview_Chart;

defined('ABSPATH') || exit;

class Integration
{
    use Singleton;

    public function init()
    {
        
        // Include include mf-chart.js file
        add_action('admin_enqueue_scripts', [$this, 'enqueue_files']);

        // Require quiz related files
        require_once 'overview_chart.php';

        add_action('metform_after_entries_table_data', [$this, 'add_quiz_data_to_entries_table'], 10, 3);
    }

    public function enqueue_files($hook){
        $screen = get_current_screen(); 

        if('post.php' === $hook && 'metform-entry' === $screen->post_type){

            // Load the css files only when needed
            wp_enqueue_style('mf-quiz-admin-styles', \MetForm_Pro\Plugin::instance()->core_url() . 'features/quiz/assets/css/mf-quiz-admin.css', false, \MetForm_Pro\Plugin::instance()->version());

            wp_enqueue_script('mf-charts', \MetForm_Pro\Plugin::instance()->core_url() . 'features/quiz/assets/js/mf-charts.js', ['jquery'], \MetForm_Pro\Plugin::instance()->version(), false);
        }
    }

    public function add_quiz_data_to_entries_table($form_id, $form_data, $map_data)
    {
        $form_settings = \MetForm\Core\Forms\Action::instance()->get_all_data($form_id);
        if(isset($form_settings['form_type']) && $form_settings['form_type'] === 'quiz-form'){
            // Check if quiz data available

            $quiz_overview = $this->get_quiz_overview_details($form_data);

            // return if there is no quiz data available
            if(!$quiz_overview || !$quiz_overview['total_questions']) return;
            
            $conrrect_percentage = round($quiz_overview['correct_parcentage'], 2);

            $wrong_percentage = 100 - $quiz_overview['correct_parcentage'];
            $wrong_percentage = round($wrong_percentage, 2);

            $overview_chart_html = Overview_Chart::get_quiz_overview_data_chart($conrrect_percentage, $wrong_percentage);

            // Display quiz data
            $output = "
            <tr class='mf-data-label'>
                <td colspan='2'><strong>". __('Quiz Result', 'metform-pro') ."</strong></td>
            </tr>
            <tr class='mf-data-value'>
                <td>&nbsp;</td>
                <td>
                    <div class='quiz_overview_data_wrap'>
                        <div class='quiz_overview_data_contents'>
                            <table class='quiz_overview_data_table'>
                                <tr>
                                    <th>". __('Total Questions:', 'metform-pro') ."</th>
                                    <td><strong>{$quiz_overview['total_questions']}</td>
                                </tr>
                                <tr>
                                    <th>". __('Correct Answers:', 'metform-pro') ."</th>
                                    <td><strong>{$quiz_overview['total_correct_answers']}</strong></td>
                                </tr>
                                <tr>
                                    <th>". __('Wrong Answers:', 'metform-pro') ."</th>
                                    <td><strong>{$quiz_overview['wrong_asnwer']}</strong></td>
                                </tr>
                                <tr>
                                    <th>". __('Correct Percentage:', 'metform-pro') ."</th>
                                    <td><strong>{$conrrect_percentage}%</strong></td>
                                </tr>
                                <tr>
                                    <th>". __('Total Marks:', 'metform-pro') ."</th>
                                    <td><strong>{$quiz_overview['total_marks']}</strong></td>
                                </tr>
                            </table>
                        </div>
                        <div class='quiz_overview_data_chart'>
                            {$overview_chart_html}
                        </div>
                    </div>
                </td>
            </tr>";

            echo $output;
        }
    }

    protected function get_quiz_overview_details($form_data) {

        $total_questions = 0;
        $total_correct_answers = 0;
        $wrong_asnwer = 0;
        $correct_parcentage = 0;
        $total_marks = 0;

        if(
            isset($form_data['wrong-answer']) && 
            isset($form_data['quiz-marks']) && 
            isset($form_data['total-question']) && 
            isset($form_data['right-answer'])
        ){
            if(!empty($form_data['wrong-answer'])){
                $wrong_asnwer = count(explode(",", $form_data['wrong-answer']));
            }
            if(!empty($form_data['right-answer'])){
                $total_correct_answers = count(explode(",", $form_data['right-answer']));
            }

            $total_questions = $form_data['total-question'] ? $form_data['total-question'] : 0;
            $total_marks = $form_data['quiz-marks'] ? $form_data['quiz-marks'] : 0;

            $total_answered_questions = $wrong_asnwer + $total_correct_answers;

            if($total_answered_questions){
                $correct_parcentage = ($total_correct_answers / $total_answered_questions) * 100;
            } else {
                $correct_parcentage = 0;
            }
            

        } else {
            return false;
        }

        return [
            'total_questions' => $total_questions,
            'total_correct_answers' => $total_correct_answers,
            'wrong_asnwer' => $wrong_asnwer,
            'correct_parcentage' => $correct_parcentage,
            'total_marks' => $total_marks
        ];
    }
}

Integration::instance()->init();
