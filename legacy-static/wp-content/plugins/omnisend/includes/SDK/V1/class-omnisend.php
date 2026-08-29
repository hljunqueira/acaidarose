<?php
/**
 * Omnisend Client
 *
 * @package OmnisendClient
 */

namespace Omnisend\SDK\V1;

use Omnisend\Internal\V1\Client;
use Omnisend\Internal\Options;
use Omnisend\SDK\V1\Options as UserOptions;

defined( 'ABSPATH' ) || die( 'no direct access' );

class Omnisend {

	/**
	 * Factory to create Omnisend client.
	 *
	 * @param $plugin string plugin using client name
	 * @param $version string plugin using client version
	 * @param $options null|UserOptions plugin using additional options
	 *
	 * @return Client
	 */
	public static function get_client( $plugin, $version, $options = null ): Client {
		$options = ( $options instanceof UserOptions ) ? $options : null;

		return new Client( Options::get_api_key(), (string) $plugin, (string) $version, $options );
	}

	/**
	 * Check and return if plugin connected to Omnisend account. If connection does not exist, it will not be possible
	 * to send data to Omnisend.
	 *
	 * @return bool
	 */
	public static function is_connected(): bool {
		return Options::get_api_key() != '';
	}
}
