{
  description = "All GNOME backgrounds";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-23.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      rec {
        name = "all-gnome-backgrounds";
        packages.backgrounds = import ./default.nix { pkgs = nixpkgs.legacyPackages.${system}; };
        packages.default = packages.backgrounds;
        devShells.default = import ./shell.nix { pkgs = nixpkgs.legacyPackages.${system}; };
      }
    );
}
