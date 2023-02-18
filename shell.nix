{ pkgs ? import <nixpkgs> { }}:

with pkgs;
pkgs.mkShell {
          buildInputs = [ pkgs.nodejs pkgs.yarn imagemagickBig moreutils jq librsvg git libjxl gnumake perl findimagedupes perl536Packages.XMLXPath blockhash haskellPackages.perceptual-hash ];
          shellHook = ''
            export PATH="$(pwd)/node_modules/.bin:$PATH"
          '';
        }