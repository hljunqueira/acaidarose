<?php
/**
 * Omnisend Client
 *
 * @package OmnisendClient
 */

namespace Omnisend\SDK\V1;

defined( 'ABSPATH' ) || die( 'no direct access' );

class Options {
	/**
	 * @var string $origin
	 */
	private $origin;

	/**
	 * Sets origin
	 *
	 * @param string $origin
	 *
	 * @return void
	 */
	public function set_origin( $origin ): void {
		$this->origin = $origin;
	}

	/**
	 * Gets origin, used by Client
	 *
	 * @return string
	 */
	public function get_origin(): string {
		return is_string( $this->origin ) ? $this->origin : '';
	}
}
